/**
 * theme-toggle.js — adapté à ton projet
 * ✅ Fonctionne avec ton HTML actuel :
 *    <button id="themeToggle" class="theme-toggle-btn"><i ...></i></button>
 * ✅ Ajoute/enlève body.light-theme (compatible avec ton CSS)
 * ✅ Persiste le choix dans localStorage
 * ✅ Suit la préférence système si aucun choix enregistré
 * ✅ Évite les erreurs si le bouton n’existe pas
 * ✅ Évite les double listeners si navbar.js gère déjà le thème (protection)
 */

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  // Protection : si navbar.js a déjà bind le thème, on ne double pas.
  if (btn.dataset.themeBound === "true") return;
  btn.dataset.themeBound = "true";

  const body = document.body;
  const storageKey = "theme";

  const icon = btn.querySelector("i"); // dans ton HTML : <i class="fa-solid fa-circle-half-stroke"></i>

  const themeStateEl = document.getElementById("themeState");

  const applyTheme = (mode) => {
    const isLight = mode === "light";
    body.classList.toggle("light-theme", isLight);
    document.documentElement.dataset.theme = mode;

    // a11y: aria-pressed true = light, false = dark
    btn.setAttribute("aria-pressed", String(isLight));
    if (themeStateEl) themeStateEl.textContent = isLight ? "Light" : "Dark";

    if (icon) icon.className = "fa-solid fa-circle-half-stroke";

    try {
      localStorage.setItem(storageKey, mode);
    } catch (_) {}
  };

  const getInitialTheme = () => {
    // Prefer theme set by head script (persisted from previous visit)
    const fromHtml = document.documentElement.dataset.theme;
    if (fromHtml === "light" || fromHtml === "dark") return fromHtml;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}

    const prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  };

  // Init: apply saved or system preference so persistence is reliable
  applyTheme(getInitialTheme());

  // Toggle
  btn.addEventListener("click", () => {
    const isLight = body.classList.contains("light-theme");
    applyTheme(isLight ? "dark" : "light");
  });
});
