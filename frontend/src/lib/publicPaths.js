export function getStorefrontPath(slug) {
  return `/s/${slug}`;
}

export function getVerifyPath(badgeCode) {
  return `/verify/${badgeCode}`;
}

export function parseStorefrontSlug() {
  const fromPath = window.location.pathname.match(/\/s\/([^/]+)/)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);
  return new URLSearchParams(window.location.search).get("slug");
}

export function parseVerifyCode() {
  const fromPath = window.location.pathname.match(/\/verify\/([^/]+)/)?.[1];
  if (fromPath) return decodeURIComponent(fromPath);
  return new URLSearchParams(window.location.search).get("code");
}
