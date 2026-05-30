import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

type Payload = {
  productName: string;
  category: string;
  language: "EN" | "UR" | "HI";
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Payload;
    if (!body.productName || !body.category) {
      return NextResponse.json({ error: "productName and category are required" }, { status: 400 });
    }

    const langRule =
      body.language === "UR"
        ? "Write in Urdu."
        : body.language === "HI"
          ? "Write in Hindi."
          : "Write in English.";

    const prompt = `
Generate e-commerce copy for a Kashmir marketplace product.

Product: ${body.productName}
Category: ${body.category}
${langRule}

Return valid JSON with exactly these keys:
- shortDescription (around 50 words)
- longDescription (around 150 words)
- whatsappPitch (around 30 words)
`.trim();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n")
      .trim();
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Model did not return JSON output");
    }

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      shortDescription: string;
      longDescription: string;
      whatsappPitch: string;
    };

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate product descriptions" },
      { status: 500 }
    );
  }
}
