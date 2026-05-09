import { gemini, geminiModel } from "../config/gemini.js";
import { supabase } from "../config/supabase.js";
import { buildSystemPrompt } from "../utils/systemPrompt.js";

function getMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function getMonthlyQueriesUsed(userId) {
  const { data, error } = await supabase
    .from("advisor_conversations")
    .select("query_count")
    .eq("user_id", userId)
    .gte("updated_at", getMonthStartIso());
  if (error) throw error;
  return (data || []).reduce((sum, row) => sum + (row.query_count || 0), 0);
}

async function fetchBusinessContext(userId, storefrontId) {
  let storefront = null;
  if (storefrontId) {
    const { data } = await supabase
      .from("storefronts")
      .select("id, business_name, sector, district")
      .eq("id", storefrontId)
      .eq("user_id", userId)
      .maybeSingle();
    storefront = data || null;
  } else {
    const { data } = await supabase
      .from("storefronts")
      .select("id, business_name, sector, district")
      .eq("user_id", userId)
      .maybeSingle();
    storefront = data || null;
  }

  const storefrontIdToUse = storefront?.id;
  const [{ data: products }, { count: monthlyViews }] = await Promise.all([
    storefrontIdToUse
      ? supabase.from("products").select("name").eq("storefront_id", storefrontIdToUse).eq("is_available", true)
      : Promise.resolve({ data: [] }),
    storefrontIdToUse
      ? supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("storefront_id", storefrontIdToUse)
          .eq("event_type", "view")
          .gte("created_at", getMonthStartIso())
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    storefront,
    products: (products || []).map((p) => p.name),
    monthlyViews: monthlyViews || 0,
  };
}

async function getConversation(userId, conversationId) {
  if (!conversationId) return null;
  const { data, error } = await supabase
    .from("advisor_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function chat(req, res, next) {
  try {
    const { message, storefront_id, conversation_id } = req.body;
    const limit = Number(process.env.FREE_TIER_AI_LIMIT || 5);

    const queriesUsed = await getMonthlyQueriesUsed(req.userId);
    if (queriesUsed >= limit) {
      return res.status(429).json({
        error: "Monthly free AI limit reached. Please upgrade your plan.",
        queries_used: queriesUsed,
        queries_limit: limit,
      });
    }

    let conversation = await getConversation(req.userId, conversation_id);
    if (!conversation) {
      const { data: created, error: createError } = await supabase
        .from("advisor_conversations")
        .insert({
          user_id: req.userId,
          storefront_id: storefront_id || null,
          messages: [],
          query_count: 0,
        })
        .select("*")
        .single();
      if (createError) throw createError;
      conversation = created;
    }

    const businessContext = await fetchBusinessContext(req.userId, storefront_id || conversation.storefront_id);
    const systemPrompt = buildSystemPrompt({
      businessName: businessContext.storefront?.business_name,
      sector: businessContext.storefront?.sector,
      district: businessContext.storefront?.district,
      productList: businessContext.products,
      monthlyViews: businessContext.monthlyViews,
    });

    const previousMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const allMessages = [...previousMessages, { role: "user", content: message }];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let finalReply = "";
    const stream = await gemini.models.generateContentStream({
      model: geminiModel,
      contents: allMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: systemPrompt,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text || "";
      if (text) {
        finalReply += text;
        res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
      }
    }

    const updatedMessages = [...allMessages, { role: "assistant", content: finalReply }];
    const { error: updateError } = await supabase
      .from("advisor_conversations")
      .update({
        storefront_id: storefront_id || conversation.storefront_id || null,
        messages: updatedMessages,
        query_count: (conversation.query_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)
      .eq("user_id", req.userId);
    if (updateError) throw updateError;

    res.write(
      `data: ${JSON.stringify({
        type: "done",
        reply: finalReply,
        conversation_id: conversation.id,
        queries_used: queriesUsed + 1,
        queries_limit: limit,
      })}\n\n`
    );
    res.end();
  } catch (error) {
    return next(error);
  }
}

export async function listConversations(req, res, next) {
  try {
    const { data, error } = await supabase
      .from("advisor_conversations")
      .select("id, storefront_id, query_count, created_at, updated_at, messages")
      .eq("user_id", req.userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const summary = (data || []).map((c) => {
      const messages = Array.isArray(c.messages) ? c.messages : [];
      const firstUserMessage = messages.find((m) => m.role === "user")?.content || "New conversation";
      return {
        id: c.id,
        storefront_id: c.storefront_id,
        query_count: c.query_count,
        preview: firstUserMessage.slice(0, 100),
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });

    return res.json(summary);
  } catch (error) {
    return next(error);
  }
}

export async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("advisor_conversations")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.userId)
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("advisor_conversations").delete().eq("id", id).eq("user_id", req.userId);
    if (error) throw error;
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
}
