const THEME_KEY = "kc-theme";

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function setTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  localStorage.setItem(THEME_KEY, next);
  document.documentElement.setAttribute("data-theme", next);
  return next;
}

export function initTheme() {
  document.documentElement.setAttribute("data-theme", getTheme());
}

export function toggleTheme() {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}
