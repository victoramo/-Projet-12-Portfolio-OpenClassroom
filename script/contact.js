document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  // zone message (créée si absente)
  let messageBox = document.getElementById("form-message");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "form-message";
    messageBox.className = "form-message";
    messageBox.setAttribute("aria-live", "polite");
    // on l’insère en haut du form pour visibilité
    form.prepend(messageBox);
  }

  const submitButton = form.querySelector('button[type="submit"]');

  // Action (par défaut => FormSubmit vers ta boite)
  const defaultEndpoint = "https://formsubmit.co/ajax/boukersi.aomar@gmail.com";
  const endpoint = (form.getAttribute("action") || defaultEndpoint).trim();

  // Petite helper UI
  const setMsg = (text, type) => {
    messageBox.textContent = text;
    messageBox.className = `form-message ${type ? `form-message--${type}` : ""}`.trim();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot anti-bot (si présent)
    const honeypot = form.querySelector("#website, input[name='website']");
    if (honeypot && honeypot.value && honeypot.value.trim() !== "") {
      setMsg("Formulaire bloqué (anti-spam).", "error");
      return;
    }

    // Anti-injection simple (bloque <script>..</script>)
    const inputs = form.querySelectorAll("input[type=text], input[type=email], textarea");
    const scriptRegex = /<\s*script\b[^>]*>(.*?)<\s*\/\s*script>/gi;
    for (const input of inputs) {
      if (scriptRegex.test(String(input.value || ""))) {
        setMsg("Le contenu du formulaire contient du code interdit.", "error");
        return;
      }
    }

    const formData = new FormData(form);

    // Sécurise les options côté FormSubmit (au cas où pas mis dans le HTML)
    if (!formData.has("_captcha")) formData.set("_captcha", "false");
    if (!formData.has("_subject")) formData.set("_subject", "Nouveau message — Portfolio QA");
    if (!formData.has("_template")) formData.set("_template", "table");

    try {
      if (submitButton) submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
      setMsg("Envoi en cours…", "");

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setMsg("Votre message a bien été envoyé !", "success");
        form.reset();
      } else {
        // On essaie de lire un message JSON si FormSubmit répond
        let extra = "";
        try {
          const data = await response.json();
          if (data && data.message) extra = ` (${data.message})`;
        } catch (_) {}
        setMsg(`Une erreur est survenue. Veuillez réessayer.${extra}`, "error");
      }
    } catch (err) {
      setMsg("Erreur réseau. Vérifiez votre connexion.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
      form.setAttribute("aria-busy", "false");

      setTimeout(() => {
        setMsg("", "");
      }, 6000);
    }
  });
});
