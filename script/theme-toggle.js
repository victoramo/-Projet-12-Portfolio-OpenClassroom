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

  const applyTheme = (mode) => {
    const isLight = mode === "light";
    body.classList.toggle("light-theme", isLight);

    // a11y
    btn.setAttribute("aria-pressed", String(isLight));

    // (Option) switch icon si tu veux :
    // - garde le half-stroke => icon fixe (recommandé)
    // - sinon : soleil/lune
    if (icon) {
      // icon.className = isLight ? "fa-solid fa-sun" : "fa-solid fa-moon";
      icon.className = "fa-solid fa-circle-half-stroke";
    }

    try {
      localStorage.setItem(storageKey, mode);
    } catch (_) {}
  };

  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}

    const prefersLight =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;

    return prefersLight ? "light" : "dark";
  };

  // Init
  applyTheme(getInitialTheme());

  // Toggle
  btn.addEventListener("click", () => {
    const isLight = body.classList.contains("light-theme");
    applyTheme(isLight ? "dark" : "light");
  });
});
