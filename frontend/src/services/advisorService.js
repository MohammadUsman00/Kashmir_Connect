import { API_BASE_URL } from "../config/env.js";
import { apiRequest } from "../lib/http.js";
import { getToken } from "../state/session.js";

export function listConversations() {
  return apiRequest("/advisor/conversations");
}

export function getConversation(id) {
  return apiRequest(`/advisor/conversations/${id}`);
}

export function deleteConversation(id) {
  return apiRequest(`/advisor/conversations/${id}`, { method: "DELETE" });
}

export async function streamAdvisorChat(payload, { onChunk, onDone }) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/advisor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const maybeJson = await response.json().catch(() => null);
    throw new Error(maybeJson?.error || "Advisor request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const jsonText = line.replace("data: ", "");
      const data = JSON.parse(jsonText);
      if (data.type === "chunk") onChunk?.(data.text);
      if (data.type === "done") onDone?.(data);
      if (data.type === "error") {
        throw new Error(data.error || "Advisor streaming failed");
      }
    }
  }
}
