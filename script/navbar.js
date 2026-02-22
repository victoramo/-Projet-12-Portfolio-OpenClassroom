/**
 * navbar.js — sans conflit avec theme-toggle.js
 * ✅ Scroll effect (classe navbarDark)
 * ✅ Burger menu mobile + fermeture au clic / ESC / resize
 * ✅ Highlight du lien actif (IntersectionObserver)
 *
 * ⚠️ IMPORTANT :
 * - Le thème sombre/clair est géré UNIQUEMENT par theme-toggle.js
 * - Donc : on ne touche pas à #themeToggle ici (aucun listener, aucun dataset)
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initBurgerMenu();
  initActiveNavLinks();
});

/* ------------------------------
   1) Effet navbar au scroll
-------------------------------- */
function initNavbarScroll() {
  const navbar = document.querySelector(".navbarScroll") || document.querySelector(".navbar");
  if (!navbar) return;

  let ticking = false;

  const onScroll = () => {
    const top = window.scrollY || document.documentElement.scrollTop || 0;
    navbar.classList.toggle("navbarDark", top >= 80);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  onScroll();
}

/* ------------------------------
   2) Burger menu (mobile)
-------------------------------- */
function initBurgerMenu() {
  const burger = document.querySelector(".burger");
  const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");
  if (!burger || !navLinks) return;

  const links = navLinks.querySelectorAll('a[href^="#"]');

  const openMenu = () => {
    navLinks.classList.add("nav-active");
    burger.classList.add("toggle");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    navLinks.classList.remove("nav-active");
    burger.classList.remove("toggle");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  const toggleMenu = () => {
    const isOpen = navLinks.classList.contains("nav-active");
    isOpen ? closeMenu() : openMenu();
  };

  // Anti double-binding
  if (burger.dataset.navBound !== "true") {
    burger.addEventListener("click", toggleMenu);
    burger.dataset.navBound = "true";
  }

  // Fermeture au clic sur un lien
  links.forEach((a) => {
    a.addEventListener("click", () => {
      if (navLinks.classList.contains("nav-active")) closeMenu();
    });
  });

  // Fermeture avec ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("nav-active")) closeMenu();
  });

  // Si on repasse en desktop, on ferme
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && navLinks.classList.contains("nav-active")) closeMenu();
  });
}

/* ------------------------------
   3) Lien actif (scroll spy)
-------------------------------- */
function initActiveNavLinks() {
  const navLinks = document.getElementById("navLinks") || document.querySelector(".nav-links");
  if (!navLinks) return;

  const anchors = Array.from(navLinks.querySelectorAll('a[href^="#"]'));
  if (!anchors.length) return;

  const sections = anchors
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    anchors.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${id}`);
    });
  };

  // IntersectionObserver (perf + fiabilité)
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    sections.forEach((sec) => observer.observe(sec));
    return;
  }

  // Fallback simple
  window.addEventListener(
    "scroll",
    () => {
      const scrollPos = window.scrollY + 120;
      let current = sections[0]?.id;
      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollPos) current = sec.id;
      });
      if (current) setActive(current);
    },
    { passive: true }
  );
}
