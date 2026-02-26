/**
 * portfolio.js — filtres corrigés + filtres "sur mesure"
 * ✅ "Test" => "QA & test"
 * ✅ QA & test = 4 projets (JSE Avocats, 724events, Eco Bliss Bath, Tomsen by PayForge)
 * ✅ Gestion de projet = 2 projets (Menu Maker by Qwenta, Tomsen by PayForge)
 * ✅ Anti double init + anti doublon "Tous"
 */

(() => {
  // ✅ Anti double init (si portfolio.js est inclus 2 fois)
  if (window.__PORTFOLIO_INIT_DONE__) return;
  window.__PORTFOLIO_INIT_DONE__ = true;

  document.addEventListener("DOMContentLoaded", () => initPortfolio());

  const PORTFOLIO_URL = "./data/portfolio.json";

  // Slug pour filtres (stable)
  function toSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9&\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Key pour matcher projets (tolère ponctuation / variantes)
  function toKey(value) {
    return toSlug(value).replace(/&/g, " ").replace(/\s+/g, " ").trim();
  }

  // ✅ Alias catégories (ici: "Test" => "QA & test")
  function normalizeCategoryLabel(label) {
    const raw = String(label || "").trim();
    const slug = toSlug(raw);

    if (slug === "tous") return null; // on ignore "Tous" venu du JSON (sinon doublon)
    if (slug === "test") return { slug: "qa & test", label: "QA & test" };
    if (slug === "qa & test" || slug === "qa test") return { slug: "qa & test", label: "QA & test" };

    // normal par défaut
    return { slug, label: raw || "Autres" };
  }

  // ✅ Filtres "sur mesure" (affichent une liste fixe de projets)
  const CUSTOM_FILTERS = {
    "qa & test": {
      label: "QA & test",
      includeTitles: ["JSE Avocats", "724events", "Eco Bliss Bath", "Tomsen by PayForge"],
    },
    "gestion de projet": {
      label: "Gestion de projet",
      includeTitles: ["Menu Maker by Qwenta", "Tomsen by PayForge"],
    },
  };

  function projectMatchesTitle(item, title) {
    const t = toKey(title);
    const idKey = toKey(item?.id);
    const titleKey = toKey(item?.title);

    // Match souple: id OU title contient le "titre cible"
    return (idKey && idKey.includes(t)) || (titleKey && titleKey.includes(t));
  }

  async function initPortfolio() {
    const container = document.getElementById("portfolioCards");
    const filterContainer = document.getElementById("portfolioFilters");
    if (!container || !filterContainer) return;

    filterContainer.innerHTML = "";
    container.innerHTML = `<p class="text-center m-0">Loading — Chargement des projets…</p>`;

    let data;
    try {
      const res = await fetch(PORTFOLIO_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
      if (!Array.isArray(data)) throw new Error("portfolio.json invalide : tableau attendu");
    } catch (err) {
      console.error("[portfolio.js] Erreur chargement JSON:", err);
      container.innerHTML =
        `<p class="exp-error">Impossible de charger les projets. Vérifie <code>data/portfolio.json</code> et la console.</p>`;
      return;
    }

    // 1) Normalise catégories pour chaque projet
    const projects = data.map((item) => {
      const rawCats = item?.categorie;
      const cats = Array.isArray(rawCats) ? rawCats : rawCats ? [rawCats] : [];

      const normalized = cats
        .map(normalizeCategoryLabel)
        .filter(Boolean); // retire null

      return {
        ...item,
        __catSlugs: normalized.map((c) => c.slug),
        __catLabels: normalized.map((c) => c.label),
      };
    });

    // 2) Construit la liste des filtres (Map slug -> label)
    const filtersMap = new Map();

    projects.forEach((p) => {
      p.__catLabels.forEach((label) => {
        const norm = normalizeCategoryLabel(label);
        if (!norm) return;
        if (!filtersMap.has(norm.slug)) filtersMap.set(norm.slug, norm.label);
      });
    });

    // ✅ Force l’existence de tes filtres "QA & test" et "Gestion de projet"
    Object.entries(CUSTOM_FILTERS).forEach(([slug, cfg]) => {
      filtersMap.set(slug, cfg.label);
    });

    // ✅ Ordre conseillé (facultatif)
    const ORDER = [
      "gestion de projet",
      "qa & test",
      "automatisation",
      "qualite web",
      "dev & versioning",
      "productivite",
    ];

    const dynamicFilters = Array.from(filtersMap.entries()).sort(([slugA, labelA], [slugB, labelB]) => {
      const ia = ORDER.indexOf(slugA);
      const ib = ORDER.indexOf(slugB);
      if (ia === -1 && ib === -1) return labelA.localeCompare(labelB, "fr");
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    // 3) Liste finale des boutons (1 seul Tous)
    const FILTERS = [{ slug: "tous", label: "Tous" }, ...dynamicFilters.map(([slug, label]) => ({ slug, label }))];

    // Render buttons
    filterContainer.innerHTML = "";
    FILTERS.forEach(({ slug, label }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn secondary filter-btn";
      btn.dataset.filter = slug;
      btn.setAttribute("aria-pressed", slug === "tous" ? "true" : "false");
      btn.textContent = label;
      filterContainer.appendChild(btn);
    });

    // 4) Render cards
    const renderCards = (filterSlug = "tous") => {
      container.innerHTML = "";

      let filtered = [];

      // ✅ filtres sur mesure
      if (CUSTOM_FILTERS[filterSlug]) {
        const wanted = CUSTOM_FILTERS[filterSlug].includeTitles;
        filtered = projects.filter((p) => wanted.some((t) => projectMatchesTitle(p, t)));
      } else {
        filtered =
          filterSlug === "tous" ? projects : projects.filter((p) => p.__catSlugs.includes(filterSlug));
      }

      if (!filtered.length) {
        const msg = document.createElement("p");
        msg.className = "exp-error";
        msg.textContent = "Aucun projet trouvé pour ce filtre.";
        const resetBtn = document.createElement("button");
        resetBtn.type = "button";
        resetBtn.className = "btn secondary";
        resetBtn.textContent = "Tous";
        resetBtn.addEventListener("click", () => {
          filterContainer.querySelectorAll("button.filter-btn").forEach((b) => {
            const isTous = (b.dataset.filter || "") === "tous";
            b.setAttribute("aria-pressed", isTous ? "true" : "false");
            b.classList.toggle("primary", isTous);
            b.classList.toggle("secondary", !isTous);
          });
          renderCards("tous");
        });
        container.innerHTML = "";
        container.appendChild(msg);
        container.appendChild(resetBtn);
        return;
      }

      const frag = document.createDocumentFragment();

      filtered.forEach((item) => {
        const card = document.createElement("article");
        card.className = "project-card project-item";
        card.dataset.id = item.id || "";

        const img = document.createElement("img");
        img.src = item.image || "";
        img.alt = item.alt || `Aperçu du projet ${item.title || ""}`;
        img.loading = "lazy";
        img.decoding = "async";

        const h3 = document.createElement("h3");
        h3.textContent = item.title || "Projet";

        const p = document.createElement("p");
        p.textContent = item.summary || "";

        const actions = document.createElement("div");
        actions.className = "project-actions";

        const moreBtn = document.createElement("button");
        moreBtn.type = "button";
        moreBtn.className = "btn secondary open-project-modal";
        moreBtn.dataset.id = item.id || "";
        moreBtn.textContent = "En savoir plus";
        actions.appendChild(moreBtn);

        if (item.lien_github) {
          const gh = document.createElement("a");
          gh.className = "btn ghost";
          gh.href = item.lien_github;
          gh.target = "_blank";
          gh.rel = "noopener noreferrer";
          gh.textContent = "Code";
          actions.appendChild(gh);
        }

        if (item.lien_demo) {
          const demo = document.createElement("a");
          demo.className = "btn primary";
          demo.href = item.lien_demo;
          demo.target = "_blank";
          demo.rel = "noopener noreferrer";
          demo.textContent = "Démo";
          actions.appendChild(demo);
        }

        card.appendChild(img);
        card.appendChild(h3);
        if (item.summary) card.appendChild(p);
        card.appendChild(actions);

        frag.appendChild(card);
      });

      container.appendChild(frag);
    };

    // Initial render
    renderCards("tous");

    // 5) Click filtres
    filterContainer.addEventListener("click", (e) => {
      const btn = e.target.closest("button.filter-btn");
      if (!btn) return;

      const filterSlug = btn.dataset.filter || "tous";

      filterContainer.querySelectorAll("button.filter-btn").forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-pressed", active ? "true" : "false");
        b.classList.toggle("primary", active);
        b.classList.toggle("secondary", !active);
      });

      renderCards(filterSlug);
    });

    // 6) Modale
    const modalApi = ensureProjectModal();
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".open-project-modal");
      if (!btn) return;

      const id = btn.dataset.id;
      const item = projects.find((p) => String(p.id) === String(id));
      if (!item) return;

      openProjectModal(item, modalApi);
    });
  }

  function ensureProjectModal() {
    let modal = document.getElementById("projectModal");
    let modalDetails = document.getElementById("projectModalDetails");
    let closeBtn = modal ? modal.querySelector(".close") : null;

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "projectModal";
      modal.className = "modal";
      modal.style.display = "none";

      const content = document.createElement("div");
      content.className = "my-modal-content";

      closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "close";
      closeBtn.textContent = "×";

      modalDetails = document.createElement("div");
      modalDetails.id = "projectModalDetails";

      content.appendChild(closeBtn);
      content.appendChild(modalDetails);
      modal.appendChild(content);
      document.body.appendChild(modal);
    }

    if (!modal.dataset.bound) {
      modal.dataset.bound = "true";
      const close = () => (modal.style.display = "none");
      closeBtn?.addEventListener("click", close);
      modal.addEventListener("click", (e) => {
        if (e.target === modal) close();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display !== "none") close();
      });
    }

    return { modal, modalDetails };
  }

  function openProjectModal(item, { modal, modalDetails }) {
    modalDetails.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = item.title || "Projet";
    modalDetails.appendChild(title);

    if (item.summary) {
      const section = document.createElement("section");
      section.innerHTML = `<h4>Résumé</h4><p></p>`;
      section.querySelector("p").textContent = item.summary;
      modalDetails.appendChild(section);
    }

    if (item.objective) {
      const section = document.createElement("section");
      section.innerHTML = `<h4>Objectif</h4><p></p>`;
      section.querySelector("p").textContent = item.objective;
      modalDetails.appendChild(section);
    }

    const links = document.createElement("div");
    links.className = "project-modal-links";
    if (item.lien_github) {
      const gh = document.createElement("a");
      gh.className = "btn ghost";
      gh.href = item.lien_github;
      gh.target = "_blank";
      gh.rel = "noopener noreferrer";
      gh.textContent = "Code";
      links.appendChild(gh);
    }
    if (item.lien_demo) {
      const demo = document.createElement("a");
      demo.className = "btn primary";
      demo.href = item.lien_demo;
      demo.target = "_blank";
      demo.rel = "noopener noreferrer";
      demo.textContent = "Démo";
      links.appendChild(demo);
    }
    if (links.children.length) modalDetails.appendChild(links);

    modal.style.display = "flex";
  }
})();
