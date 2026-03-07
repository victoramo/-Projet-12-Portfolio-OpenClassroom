/**
 * theme-toggle.js
 * ✅ Fonctionne avec <button id="themeToggle" class="theme-toggle-btn">
 * ✅ Ajoute/enlève body.light-theme
 * ✅ Persiste dans localStorage
 * ✅ Suit la préférence système si aucun choix enregistré
 * ✅ Protection anti double-binding
 */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  if (btn.dataset.themeBound === "true") return;
  btn.dataset.themeBound = "true";

  const body       = document.body;
  const storageKey = "theme";
  const icon       = btn.querySelector("i");
  const themeStateEl = document.getElementById("themeState");

  const applyTheme = (mode) => {
    const isLight = mode === "light";
    body.classList.toggle("light-theme", isLight);
    document.documentElement.dataset.theme = mode;

    btn.setAttribute("aria-pressed", String(isLight));
    if (themeStateEl) themeStateEl.textContent = isLight ? "Light" : "Dark";
    if (icon) icon.className = "fa-solid fa-circle-half-stroke";

    try { localStorage.setItem(storageKey, mode); } catch (_) {}
  };

  const getInitialTheme = () => {
    const fromHtml = document.documentElement.dataset.theme;
    if (fromHtml === "light" || fromHtml === "dark") return fromHtml;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  };

  applyTheme(getInitialTheme());

  btn.addEventListener("click", () => {
    applyTheme(body.classList.contains("light-theme") ? "dark" : "light");
  });
});