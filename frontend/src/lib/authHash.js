import { setToken } from "../state/session.js";

/** Parse Supabase auth tokens from URL hash (password recovery, email confirm). */
export function consumeAuthHashFromUrl() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const accessToken = params.get("access_token");
  const type = params.get("type");

  if (!accessToken) return null;

  setToken(accessToken);

  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", cleanUrl);

  return { type, accessToken };
}
