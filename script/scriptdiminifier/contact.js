/**
 * contact.js
 * ✅ Envoi via FormSubmit (AJAX)
 * ✅ Honeypot anti-bot
 * ✅ Anti-injection <script>
 * ✅ Feedback utilisateur (succès / erreur / réseau)
 * ✅ Reset bouton après envoi
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  let messageBox = document.getElementById("form-message");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "form-message";
    messageBox.className = "form-message";
    messageBox.setAttribute("aria-live", "polite");
    form.prepend(messageBox);
  }

  const submitButton   = form.querySelector('button[type="submit"]');
  const defaultEndpoint = "https://formsubmit.co/ajax/boukersi.aomar@gmail.com";
  const endpoint        = (form.getAttribute("action") || defaultEndpoint).trim();

  const setMsg = (text, type) => {
    messageBox.textContent = text;
    messageBox.className = `form-message${type ? ` form-message--${type}` : ""}`;
    messageBox.setAttribute(
      "data-submit-status",
      type === "success" ? "success" : type === "error" ? "error" : ""
    );
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Honeypot
    const honeypot = form.querySelector("#website, input[name='website']");
    if (honeypot?.value?.trim()) {
      setMsg("Formulaire bloqué (anti-spam).", "error");
      return;
    }

    // Anti-injection
    const inputs      = form.querySelectorAll("input[type=text], input[type=email], textarea");
    const scriptRegex = /<\s*script\b[^>]*>(.*?)<\s*\/\s*script>/gi;
    for (const input of inputs) {
      if (scriptRegex.test(String(input.value || ""))) {
        setMsg("Le contenu du formulaire contient du code interdit.", "error");
        return;
      }
    }

    const formData = new FormData(form);
    if (!formData.has("_captcha"))  formData.set("_captcha",  "false");
    if (!formData.has("_subject"))  formData.set("_subject",  "Nouveau message — Portfolio QA");
    if (!formData.has("_template")) formData.set("_template", "table");

    try {
      if (submitButton) submitButton.disabled = true;
      form.setAttribute("aria-busy", "true");
      setMsg("Envoi en cours…", "");

      const response = await fetch(endpoint, {
        method:  "POST",
        body:    formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        setMsg("Votre message a bien été envoyé !", "success");
        form.reset();
        if (submitButton) submitButton.disabled = true;
        setTimeout(() => {
          if (submitButton) submitButton.disabled = false;
        }, 2000);
      } else {
        let extra = "";
        try {
          const data = await response.json();
          if (data?.message) extra = ` (${data.message})`;
        } catch (_) {}
        setMsg(`Une erreur est survenue. Veuillez réessayer.${extra}`, "error");
      }
    } catch (err) {
      setMsg("Erreur réseau. Vérifiez votre connexion.", "error");
    } finally {
      if (submitButton && messageBox.getAttribute("data-submit-status") !== "success") {
        submitButton.disabled = false;
      }
      form.setAttribute("aria-busy", "false");

      setTimeout(() => {
        setMsg("", "");
        messageBox.removeAttribute("data-submit-status");
      }, 6000);
    }
  });
});