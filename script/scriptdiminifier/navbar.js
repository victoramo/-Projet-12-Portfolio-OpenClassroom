/**
 * navbar.js — logo = déclencheur principal (burger supprimé)
 * ✅ Effet navbarDark au scroll
 * ✅ Scroll-Spy (IntersectionObserver)
 * ✅ Mode ÉTENDU/COMPACT (desktop > 1286px) via logo
 * ✅ Mode RAIL ICÔNES (≤ 1286px) via logo — ouvre/ferme nav-links.nav-active
 * ✅ Fermeture : clic lien / ESC / clic extérieur / resize
 * ✅ Scroll body jamais bloqué indéfiniment
 * ✅ Bouton thème flottant synchronisé (#themeToggleFloat → #themeToggle)
 * ✅ Barre responsive (logo + actions) visible au scroll haut ET bas
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavbarScrollState();
  initLogoAsPrimaryTrigger();
  initActiveNavLinks();
  initFloatThemeToggle();
  initResponsiveTopBar();
});

/* ====
   CONSTANTES & HELPERS
==== */
const MOBILE_BP      = 1286;
const THRESHOLD_DARK = 80;
const THRESHOLD_COLL = 120;
const TOP_EPS        = 4;

const navbar     = document.querySelector(".site-navbar");
const logoLink   = document.querySelector(".floating-logo");
const navLinksEl = document.getElementById("navLinks") || document.querySelector(".nav-links");

const isMobile = () => window.innerWidth <= MOBILE_BP;

function expandNav() {
  if (!navbar) return;
  navbar.classList.remove("nav-collapsed");
  navbar.classList.add("nav-expanded");
}
function collapseNav() {
  if (!navbar) return;
  navbar.classList.remove("nav-expanded");
  navbar.classList.add("nav-collapsed");
}

/* ====
   RAIL — open / close / toggle
==== */
function openRail() {
  if (!navLinksEl || !logoLink) return;
  navLinksEl.classList.add("nav-active");
  logoLink.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeRail() {
  if (!navLinksEl || !logoLink) return;
  navLinksEl.classList.remove("nav-active");
  logoLink.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function toggleRail() {
  navLinksEl && navLinksEl.classList.contains("nav-active")
    ? closeRail()
    : openRail();
}

/* ====
   1) SCROLL — navbarDark + compact/expanded + plafond
==== */
function initNavbarScrollState() {
  if (!navbar) return;

  let lastScroll = window.scrollY || 0;
  let darkState  = false;
  let collState  = false;

  const applyInitial = () => {
    const top = window.scrollY || 0;
    top <= THRESHOLD_COLL ? expandNav() : collapseNav();
    navbar.classList.toggle("navbarDark", top >= THRESHOLD_DARK);
    darkState  = top >= THRESHOLD_DARK;
    collState  = top > THRESHOLD_COLL;
    lastScroll = top;
  };

  const onScroll = () => {
    if (navLinksEl && navLinksEl.classList.contains("nav-active")) return;

    const top     = window.scrollY || 0;
    const newDark = top >= THRESHOLD_DARK;

    if (newDark !== darkState) {
      navbar.classList.toggle("navbarDark", newDark);
      darkState = newDark;
    }

    if (top <= TOP_EPS) {
      if (collState) { expandNav(); collState = false; }
      lastScroll = top;
      return;
    }

    if (top > lastScroll && top > THRESHOLD_COLL && !collState) {
      collapseNav();
      collState = true;
    }

    lastScroll = top;
  };

  applyInitial();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ====
   2) LOGO = déclencheur principal
==== */
function initLogoAsPrimaryTrigger() {
  if (!logoLink || !navLinksEl) return;

  logoLink.setAttribute("role", "button");
  logoLink.setAttribute("aria-controls", navLinksEl.id || "navLinks");
  logoLink.setAttribute("aria-expanded", "false");

  logoLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (isMobile()) {
      toggleRail();
    } else {
      navbar && navbar.classList.contains("nav-collapsed")
        ? expandNav()
        : collapseNav();
    }
  });

  navLinksEl.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      if (isMobile()) closeRail();
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMobile()) closeRail();
  });

  document.addEventListener("click", (e) => {
    if (!navLinksEl.classList.contains("nav-active")) return;
    if (!navLinksEl.contains(e.target) && !logoLink.contains(e.target)) {
      closeRail();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isMobile()) {
        closeRail();
        expandNav();
      } else {
        if (navbar) navbar.classList.remove("nav-expanded", "nav-collapsed");
      }
    }, 120);
  });
}

/* ====
   3) SCROLL-SPY (liens actifs)
==== */
function initActiveNavLinks() {
  if (!navLinksEl) return;

  const anchors = Array.from(navLinksEl.querySelectorAll('a[href^="#"]'));
  if (!anchors.length) return;

  const anchorMap = new Map(anchors.map((a) => [a.getAttribute("href"), a]));

  const sections = anchors
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    anchorMap.forEach((el, href) => {
      el.classList.toggle("active", href === `#${id}`);
    });
  };

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

/* ====
   4) BOUTON THÈME FLOTTANT — responsive ≤ 1286px
==== */
function initFloatThemeToggle() {
  const btnFloat = document.getElementById("themeToggleFloat");
  const btnMain  = document.getElementById("themeToggle");
  if (!btnFloat || !btnMain) return;

  btnFloat.addEventListener("click", () => { btnMain.click(); });

  new MutationObserver(() => {
    btnFloat.setAttribute("aria-pressed", btnMain.getAttribute("aria-pressed") ?? "false");
  }).observe(btnMain, { attributes: true, attributeFilter: ["aria-pressed"] });

  new MutationObserver(() => {
    const isLight = document.body.classList.contains("light-theme");
    btnFloat.setAttribute("aria-pressed", isLight ? "true" : "false");
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  btnFloat.setAttribute(
    "aria-pressed",
    document.body.classList.contains("light-theme") ? "true" : "false"
  );
}

/* ====
   5) BARRE RESPONSIVE — visible au scroll haut ET bas
   ✅ scroll bas  → cache  (resp-bar-hidden)
   ✅ scroll haut → affiche (resp-bar-visible)
   ✅ rail ouvert → jamais caché
==== */
function initResponsiveTopBar() {
  if (!isMobile()) return;

  const floatActions = document.querySelector(".nav-actions-float");
  if (!floatActions && !logoLink) return;

  let lastY      = window.scrollY;
  let ticking    = false;
  let barVisible = true;

  const showBar = () => {
    if (barVisible) return;
    barVisible = true;
    document.body.classList.remove("resp-bar-hidden");
    document.body.classList.add("resp-bar-visible");
  };

  const hideBar = () => {
    if (navLinksEl && navLinksEl.classList.contains("nav-active")) return;
    if (!barVisible) return;
    barVisible = false;
    document.body.classList.remove("resp-bar-visible");
    document.body.classList.add("resp-bar-hidden");
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y   = window.scrollY;
      const dir = y - lastY;

      if (y <= 10)                  showBar();
      else if (dir < -6)            showBar();
      else if (dir > 6 && y > 80)  hideBar();

      lastY   = y;
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      document.body.classList.remove("resp-bar-hidden", "resp-bar-visible");
    }
  });
}