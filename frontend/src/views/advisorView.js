import { escapeHtml } from "../lib/escape.js";

const SUGGESTED_PROMPTS = [
  "How do I price my handicrafts for tourists?",
  "Write a WhatsApp message to promote my storefront.",
  "میرے کاروبار کے لیے سادہ اردو میں مشورہ دیں۔",
  "What should I post on Instagram this week?",
  "How can I get more WhatsApp inquiries?",
];

export function renderAdvisorView({ conversations = [], activeConversationId = null } = {}) {
  const history = conversations.length
    ? conversations
        .map(
          (c) => `
        <div class="conv-row ${c.id === activeConversationId ? "active" : ""}">
          <button type="button" class="conv-item" data-load-conversation="${escapeHtml(c.id)}">
            <span>${escapeHtml(c.preview)}</span>
            <small>${escapeHtml(new Date(c.updated_at).toLocaleDateString())}</small>
          </button>
          <button type="button" class="btn btn-outline btn-sm conv-delete" data-delete-conversation="${escapeHtml(c.id)}" title="Delete">×</button>
        </div>
      `
        )
        .join("")
    : `<p class="hint">No past conversations yet.</p>`;

  const chips = SUGGESTED_PROMPTS.map(
    (p) => `<button type="button" class="prompt-chip" data-prompt="${escapeHtml(p)}">${escapeHtml(p)}</button>`
  ).join("");

  return `
    <section class="panel advisor-panel">
      <span class="section-label">AI Advisor</span>
      <h2>Business Advisor</h2>
      <p class="hint">Ask in Urdu or English. Free tier: limited queries per month.</p>
      <div class="advisor-layout">
        <aside class="advisor-sidebar">
          <div class="advisor-sidebar-head">
            <strong>History</strong>
            <button type="button" id="new-conversation-btn" class="btn btn-outline btn-sm">New</button>
          </div>
          <div class="conv-list">${history}</div>
        </aside>
        <div class="advisor-main">
          <div class="prompt-chips">${chips}</div>
          <div id="advisor-output" class="chat-box"></div>
          <form id="advisor-form" class="chat-form">
            <input type="hidden" name="conversation_id" id="conversation-id" value="${escapeHtml(activeConversationId || "")}" />
            <textarea required name="message" rows="3" placeholder="Ask in Urdu or English…"></textarea>
            <div class="chat-actions">
              <button class="btn">Ask advisor</button>
              <button type="button" id="delete-active-conversation" class="btn btn-outline" ${activeConversationId ? "" : "disabled"}>Delete chat</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}
