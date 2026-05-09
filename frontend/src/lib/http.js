import { API_BASE_URL } from "../config/env.js";
import { clearSession, getToken } from "../state/session.js";

function normalizeErrorPayload(payload, fallbackMessage) {
  if (!payload) return fallbackMessage;
  if (typeof payload === "string") return payload;
  if (payload.error) return payload.error;
  if (payload.message) return payload.message;
  return fallbackMessage;
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else if (!response.ok) {
    payload = await response.text();
  }

  if (!response.ok) {
    const message = normalizeErrorPayload(payload, "Request failed");
    if (response.status === 401) {
      clearSession();
    }
    throw new Error(message);
  }

  return payload;
}
