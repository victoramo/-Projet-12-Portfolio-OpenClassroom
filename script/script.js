/**
 * script.js — Utilitaires UI globaux (portfolio QA)
 * ✅ Génération d’un fond étoilé dans #stars
 * ✅ Performant (DocumentFragment + throttle resize)
 * ✅ Respecte prefers-reduced-motion (accessibilité)
 *
 * Dépendances HTML :
 * - <div id="stars" aria-hidden="true"></div>
 */

document.addEventListener("DOMContentLoaded", () => {
  initStarsBackground();
});

function initStarsBackground() {
  const starsContainer = document.getElementById("stars");
  if (!starsContainer) return;

  // Accessibilité : si l’utilisateur préfère réduire les animations, on met moins d’étoiles et pas de twinkle
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const render = () => {
    starsContainer.innerHTML = "";

    const isMobile = window.innerWidth <= 768;
    const numStars = reduceMotion ? (isMobile ? 25 : 50) : (isMobile ? 75 : 150);

    const frag = document.createDocumentFragment();

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement("div");
      star.className = "star";

      // Position
      star.style.top = Math.random() * 100 + "%";
      star.style.left = Math.random() * 100 + "%";

      // Opacité et animation (si autorisée)
      const opacity = reduceMotion ? 0.7 : Math.random();
      star.style.opacity = String(opacity);

      if (!reduceMotion) {
        const duration = Math.random() * 5 + 5; // 5s à 10s
        star.style.animationDuration = `${duration}s`;
      } else {
        star.style.animation = "none";
      }

      frag.appendChild(star);
    }

    starsContainer.appendChild(frag);
  };

  // Throttle resize (évite spam)
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  render();
}
