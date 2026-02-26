document.addEventListener("DOMContentLoaded", () => {
  initSkills({
    url: "./data/skills.json",
    trackId: "skillsTrack",
    filtersId: "skillsFilters",
    marqueeId: "skillsMarquee",
    gridId: "skillsGrid",
  });
});

async function initSkills({ url, trackId, filtersId, marqueeId, gridId }) {
  const track = document.getElementById(trackId);
  const filters = document.getElementById(filtersId);
  const marquee = document.getElementById(marqueeId);
  const grid = document.getElementById(gridId);

  if (!track || !filters) return;

  // 1) Chargement JSON
  let skills = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    skills = await res.json();
    if (!Array.isArray(skills)) throw new Error("skills.json doit être un tableau");
  } catch (e) {
    console.error("[skills.js] Erreur:", e);
    track.innerHTML = `<p>Impossible de charger les compétences.</p>`;
    return;
  }

  // 2) Normalisation catégories -> filtres fixes
  const normalizeCategory = (cat) => {
    const c = String(cat || "").trim();
    if (/qa\s*&\s*test/i.test(c)) return "QA & Test";
    if (/automatisation/i.test(c)) return "Automatisation";
    if (/qualit/i.test(c)) return "Qualité Web";
    if (/gestion\s*&\s*collaboration/i.test(c)) return "Gestion & Collaboration";
    if (/productivit/i.test(c)) return "Productivité";
    if (/dev\s*&\s*versioning/i.test(c)) return "Dev & Versioning";
    return "Autres";
  };

  skills = skills.map((s) => ({
    ...s,
    categoryNormalized: normalizeCategory(s.category),
  }));

  // 3) Boutons filtres
  const FILTERS = [
    "Tous",
    "Dev & Versioning",
    "Qualité Web",
    "Gestion & Collaboration",
    "Productivité",
    "Automatisation",
    "QA & Test",
  ];

  filters.innerHTML = "";
  FILTERS.forEach((label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn secondary skills-filter-btn";
    btn.dataset.filter = label;
    btn.setAttribute("aria-pressed", label === "Tous" ? "true" : "false");
    btn.textContent = label;
    filters.appendChild(btn);
  });

  // 4) Events
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".skills-filter-btn");
    if (!btn) return;

    const filter = btn.dataset.filter || "Tous";

    filters.querySelectorAll(".skills-filter-btn").forEach((b) => {
      const active = b === btn;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("primary", active);
      b.classList.toggle("secondary", !active);
    });

    render(filter);
  });

  // Render initial
  render("Tous");

  // -------- helpers --------
  function createCard(skill) {
    const card = document.createElement("div");
    card.className = "skill-card";

    // ⚠️ si ton skills.json ne contient plus "image",
    // tu peux commenter ce bloc img, ou générer src depuis id.
    if (skill.image) {
      const img = document.createElement("img");
      img.src = skill.image;
      img.alt = skill.alt || skill.title || "Compétence";
      img.loading = "lazy";
      img.decoding = "async";
      card.appendChild(img);
    }

    const span = document.createElement("span");
    span.textContent = skill.title || "";
    card.appendChild(span);

    return card;
  }

  function render(filter) {
    const filtered =
      filter === "Tous"
        ? skills
        : skills.filter((s) => s.categoryNormalized === filter);

    // vide les deux zones
    track.innerHTML = "";
    if (grid) grid.innerHTML = "";

    if (!filtered.length) {
      track.innerHTML = `<p>Aucune compétence trouvée.</p>`;
      if (marquee) marquee.hidden = false;
      if (grid) grid.hidden = true;
      return;
    }

    // ✅ Mode Tous = marquee infini
    if (filter === "Tous") {
      if (marquee) marquee.hidden = false;
      if (grid) grid.hidden = true;

      // Set 1
      const set1 = document.createElement("div");
      set1.className = "skills-set";

      // Set 2 clone (aria-hidden)
      const set2 = document.createElement("div");
      set2.className = "skills-set";
      set2.setAttribute("aria-hidden", "true");

      filtered.forEach((s) => set1.appendChild(createCard(s)));
      filtered.forEach((s) => set2.appendChild(createCard(s)));

      track.appendChild(set1);
      track.appendChild(set2);

      restartAnimation(track);
      return;
    }

    // ✅ Mode filtres = grille (pas de duplication)
    if (marquee) marquee.hidden = true;
    if (grid) grid.hidden = false;

    if (!grid) {
      // fallback : si pas de grid dans HTML, on affiche statique dans track
      filtered.forEach((s) => track.appendChild(createCard(s)));
      return;
    }

    const frag = document.createDocumentFragment();
    filtered.forEach((s) => frag.appendChild(createCard(s)));
    grid.appendChild(frag);
  }
}

function restartAnimation(el) {
  const prev = el.style.animation;
  el.style.animation = "none";
  void el.offsetHeight; // force reflow
  el.style.animation = prev || "";
}
