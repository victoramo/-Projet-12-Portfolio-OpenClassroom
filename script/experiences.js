/**
 * experiences.js — version optimisée & compatible
 * ✅ id="experienceTimeline"
 * ✅ soft skills = item contenant "summary"
 * ✅ modale optionnelle (fallback inline)
 * ✅ fetch robuste + tri plus récent
 */

document.addEventListener("DOMContentLoaded", () => {
  // évite double init si script chargé 2 fois
  if (document.body.dataset.experiencesBound === "true") return;
  document.body.dataset.experiencesBound = "true";

  createExperienceTimeline();
});

const EXPE_URL = "./data/expe.json";

function extractYears(period = "") {
  const str = String(period || "").toLowerCase();

  // gère "présent", "aujourd'hui", "en cours"
  const currentYear = new Date().getFullYear();
  const isPresent = /(présent|present|aujourd|en cours|current)/i.test(str);

  const matches = String(period).match(/\b(19|20)\d{2}\b/g);
  if (!matches) {
    return { start: isPresent ? currentYear : 0, end: isPresent ? currentYear : 0 };
  }

  const years = matches.map((y) => Number(y));
  const start = years[0] || 0;
  const end = (isPresent ? currentYear : years[years.length - 1]) || start;
  return { start, end };
}

function safeText(el, text) {
  el.textContent = text == null ? "" : String(text);
}

function buildList(items = []) {
  const ul = document.createElement("ul");
  items.forEach((it) => {
    const li = document.createElement("li");
    safeText(li, it);
    ul.appendChild(li);
  });
  return ul;
}

function safeMeta(item) {
  const company = item.company ? String(item.company) : "";
  const location = item.location ? String(item.location) : "";
  const period = item.period ? String(item.period) : "";

  // construit une ligne sans "undefined"
  const left = [company, location].filter(Boolean).join(" — ");
  if (left && period) return `${left} • ${period}`;
  return left || period || "";
}

async function createExperienceTimeline() {
  const timeline = document.getElementById("experienceTimeline") || document.querySelector(".timeline");
  if (!timeline) return;

  // Soft skills container : utilise celui dans le DOM, sinon crée-le
  let softSkillsContainer = document.querySelector(".soft-skills-container");
  if (!softSkillsContainer) {
    const experienceSection = document.getElementById("experience") || timeline.closest("section");
    if (experienceSection) {
      const softSection = document.createElement("div");
      softSection.id = "softSkillsSection";
      softSection.className = "soft-skills-section";

      const title = document.createElement("h3");
      title.className = "soft-skills-title";
      title.textContent = "Soft skills";

      softSkillsContainer = document.createElement("div");
      softSkillsContainer.className = "soft-skills-container";

      softSection.appendChild(title);
      softSection.appendChild(softSkillsContainer);
      experienceSection.appendChild(softSection);
    }
  }

  // Modale (optionnelle)
  const modal = document.getElementById("experienceModal");
  const modalHeader = document.getElementById("modalHeader");
  const modalDetails = document.getElementById("modalDetails");
  const closeBtn = modal ? modal.querySelector(".close") : null;

  // Nettoyage
  timeline.innerHTML = "";
  if (softSkillsContainer) softSkillsContainer.innerHTML = "";

  try {
    const response = await fetch(EXPE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Format expe.json invalide (attendu: tableau)");

    // Soft skills = item qui contient summary[]
    const softSkillsItem = data.find((x) => Array.isArray(x.summary));

    const experiences = data
      .filter((x) => !Array.isArray(x.summary))
      .slice()
      .sort((a, b) => {
        const ya = extractYears(a.period);
        const yb = extractYears(b.period);

        if (yb.end !== ya.end) return yb.end - ya.end;
        if (yb.start !== ya.start) return yb.start - ya.start;
        return String(b.period || "").localeCompare(String(a.period || ""));
      });

    const frag = document.createDocumentFragment();

    experiences.forEach((item) => {
      const card = document.createElement("article");
      card.className = "exp-card";
      card.dataset.id = item.id || "";

      const h3 = document.createElement("h3");
      safeText(h3, item.title || "Expérience");

      const meta = document.createElement("p");
      meta.className = "meta";
      safeText(meta, safeMeta(item));

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn secondary open-modal";
      btn.textContent = "En savoir plus";

      // Détails inline (fallback)
      const details = document.createElement("div");
      details.className = "exp-details";
      details.hidden = true;

      const addBlock = (title, arr, titleClass) => {
        if (!Array.isArray(arr) || !arr.length) return;
        const block = document.createElement("div");
        const t = document.createElement("h4");
        t.textContent = title;
        if (titleClass) t.className = titleClass;
        block.appendChild(t);
        block.appendChild(buildList(arr));
        details.appendChild(block);
      };

      addBlock("Missions", item.missions);
      addBlock("Outils", item.tools);
      addBlock("Compétences", item.skills);
      addBlock("Transférables au métier de testeur", item.linkToTesting, "accent-title");

      if (Array.isArray(item.downloads) && item.downloads.length) {
        const block = document.createElement("div");
        const t = document.createElement("h4");
        t.textContent = "Documents";
        block.appendChild(t);

        const ul = document.createElement("ul");
        item.downloads.forEach((d) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = d.file;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = d.label || "Télécharger";
          li.appendChild(a);
          ul.appendChild(li);
        });

        block.appendChild(ul);
        details.appendChild(block);
      }

      btn.addEventListener("click", () => {
        if (modal && modalHeader && modalDetails && closeBtn) {
          openModal(item, { modal, modalHeader, modalDetails });
        } else {
          details.hidden = !details.hidden;
          btn.textContent = details.hidden ? "En savoir plus" : "Réduire";
        }
      });

      card.appendChild(h3);
      card.appendChild(meta);
      card.appendChild(btn);
      card.appendChild(details);
      frag.appendChild(card);
    });

    timeline.appendChild(frag);

    // Soft skills
    if (softSkillsItem && softSkillsContainer) {
      const fragSoft = document.createDocumentFragment();

      softSkillsItem.summary.forEach((s) => {
        const card = document.createElement("div");
        card.className = "soft-skill"; // ✅ IMPORTANT : pas "skill-card"

        const h4 = document.createElement("h4");
        safeText(h4, s.title);

        const p = document.createElement("p");
        safeText(p, s.description);

        card.appendChild(h4);
        card.appendChild(p);
        fragSoft.appendChild(card);
      });

      softSkillsContainer.appendChild(fragSoft);
    }
  } catch (err) {
    const errorBox = document.createElement("p");
    errorBox.className = "exp-error";
    errorBox.textContent = "Impossible de charger les expériences. Vérifie data/expe.json et la console.";
    timeline.appendChild(errorBox);
    console.error("[experiences.js] Erreur:", err);
  }

  // Fermeture modale (si présente) — évite double binding
  if (modal && closeBtn && modal.dataset.bound !== "true") {
    modal.dataset.bound = "true";

    const close = () => (modal.style.display = "none");
    closeBtn.addEventListener("click", close);

    window.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }
}

function openModal(item, { modal, modalHeader, modalDetails }) {
  modalHeader.innerHTML = "";
  modalDetails.innerHTML = "";

  const titleEl = document.createElement("h3");
  safeText(titleEl, item.title || "Expérience");
  modalHeader.appendChild(titleEl);

  const companyEl = document.createElement("p");
  companyEl.className = "meta";
  safeText(companyEl, `${item.company || ""} — ${item.location || ""} • ${item.period || ""}`.replace(/\s—\s•/g, ""));
  modalHeader.appendChild(companyEl);

  const addSection = (title, arr, className) => {
    if (!Array.isArray(arr) || !arr.length) return;
    const section = document.createElement("div");
    if (className) section.className = className;

    const h = document.createElement("h4");
    h.textContent = title;

    section.appendChild(h);
    section.appendChild(buildList(arr));
    modalDetails.appendChild(section);
  };

  addSection("Missions", item.missions);
  addSection("Outils", item.tools);
  addSection("Compétences", item.skills);
  addSection("Transférables au métier de testeur", item.linkToTesting, "accent-title");

  if (Array.isArray(item.downloads) && item.downloads.length) {
    const section = document.createElement("div");
    const h = document.createElement("h4");
    h.textContent = "Documents";
    section.appendChild(h);

    const ul = document.createElement("ul");
    item.downloads.forEach((d) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = d.file;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = d.label || "Télécharger";
      li.appendChild(a);
      ul.appendChild(li);
    });

    section.appendChild(ul);
    modalDetails.appendChild(section);
  }

  modal.style.display = "flex";
}
