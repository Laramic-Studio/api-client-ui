const STORAGE_KEY = "noidr-theme";

export function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
  return theme;
}

export function setTheme(theme) {
  return applyTheme(theme === "light" ? "light" : "dark");
}

export function toggleTheme() {
  const next = getStoredTheme() === "dark" ? "light" : "dark";
  return applyTheme(next);
}
