<script>
// Contact-Form Only Tracker
(function () {
  "use strict";

  // --- 1. URL PARAMS & PLACEHOLDERS ---

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      userId: params.get("userId"),
      resourceId: params.get("resourceId"),
      contactId: params.get("contactId"),
    };
  }

  function replaceUrlPlaceholders({ userId, contactId }) {
    const replaceIn = (els, attr) =>
      els.forEach((el) => {
        const val = el.getAttribute(attr);
        if (val && val.includes("[user-id]")) {
          el.setAttribute(attr, val.replace(/\[user-id\]/g, userId || ""));
        }
        if (val && val.includes("[contact-id]")) {
          el.setAttribute(attr, val.replace(/\[contact-id\]/g, contactId || ""));
        }
      });

    replaceIn(document.querySelectorAll("[href]"), "href");
    replaceIn(document.querySelectorAll("[src]"), "src");
    document.querySelectorAll("*").forEach((el) => {
      Array.from(el.attributes).forEach((a) => {
        if (a.name.startsWith("data-") && a.value.includes("[")) {
          let v = a.value
            .replace(/\[user-id\]/g, userId || "")
            .replace(/\[contact-id\]/g, contactId || "");
          el.setAttribute(a.name, v);
        }
      });
    });
  }

  // --- 2. INPUT DISCOVERY ---

  function findAllPageInputs() {
    const fields = {
      firstNameInput: null,
      lastNameInput: null,
      nameInput: null,
      emailInput: document.querySelector('input[type="email"]'),
      phoneInput: document.querySelector('input[type="tel"]'),
    };
    const patterns = {
      firstName: [/first.?name/i, /fname/i],
      lastName: [/last.?name/i, /lname/i],
      name: [/^name$/i, /full.?name/i],
      email: [/e.?mail/i],
      phone: [/phone/i, /mobile/i],
    };
    const all = Array.from(
      document.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], textarea'
      )
    );

    const used = new Set();
    for (let key in patterns) {
      const metaKey = key + (key === "name" ? "Input" : "Input");
      if (fields[metaKey] && key !== "email" && key !== "phone") continue;
      for (let re of patterns[key]) {
        const found = all.find((inp) => {
          if (used.has(inp)) return false;
          return ["id", "name", "class", "placeholder", "aria-label"].some(
            (attr) => inp.getAttribute(attr)?.match(re)
          );
        });
        if (found) {
          fields[metaKey] = found;
          used.add(found);
          break;
        }
      }
    }

    if (!fields.emailInput && !fields.phoneInput) {
      console.warn("No email or phone input found; will not track contact form.");
      return null;
    }
    return fields;
  }

  // --- 3. SUBMISSION HELPER ---

  async function submitContactForm(formDataString, resourceId, senderId) {
    const apiUrl =
      "https://my.rapidfunnel.com/landing/resource/create-custom-contact";
    const body = new URLSearchParams({
      formData: formDataString,
      resourceId,
      senderId,
      sentFrom: "customPage",
    }).toString();
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        console.error("Contact submission failed:", res.status, res.statusText);
        return null;
      }
      const data = await res.json();
      return data.contactId > 0 ? data.contactId : null;
    } catch (e) {
      console.error("Error submitting contact form:", e);
      return null;
    }
  }

  // --- 4. FORM HANDLER ---

  async function handleFormSubmit(event) {
    event.preventDefault();
    const params = getUrlParams();
    const btn = event.submitter || event.target.querySelector('button, [type="submit"]');
    const inputs = findAllPageInputs();
    if (!inputs) return;

    const email = inputs.emailInput?.value.trim();
    const phone = inputs.phoneInput?.value.trim();
    if (!email && !phone) {
      console.warn("Email or phone required to submit form.");
      return;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      console.warn("Invalid email format.");
      return;
    }

    // Name splitting
    let first = "", last = "";
    if (inputs.firstNameInput?.value && inputs.lastNameInput?.value) {
      first = inputs.firstNameInput.value.trim();
      last = inputs.lastNameInput.value.trim();
    } else if (inputs.nameInput?.value) {
      [first, ...rest] = inputs.nameInput.value.trim().split(/\s+/);
      last = rest.join(" ");
    }

    const payload = {};
    if (first) payload.firstName = first;
    if (last) payload.lastName = last;
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    payload.campaign = window.rapidFunnelCampaignId || 0;
    payload.contactTag = window.rapidFunnelLabelId || 0;

    const formDataString = new URLSearchParams(payload).toString();
    const resId = Number(params.resourceId);
    const usrId = Number(params.userId);

    // disable button
    if (btn) btn.disabled = true;

    const newContactId = await submitContactForm(
      formDataString,
      resId,
      usrId
    );

    // handle redirect
    let redirected = false;
    const redirectUrlAttr = btn?.getAttribute("data-redirect");
    if (newContactId && redirectUrlAttr) {
      try {
        const u = new URL(redirectUrlAttr, window.location.origin);
        u.searchParams.set("userId", usrId);
        u.searchParams.set("resourceId", resId);
        u.searchParams.set("contactId", newContactId);
        window.location.href = u.toString();
        redirected = true;
      } catch (e) {
        console.error("Bad redirect URL:", e);
      }
    }

    // re-enable if not redirected
    if (btn && !redirected) btn.disabled = false;
  }

  // --- 5. INIT & BIND ---

  function init() {
    const params = getUrlParams();
    replaceUrlPlaceholders(params);

    document
      .querySelectorAll("form")
      .forEach((f) => f.addEventListener("submit", handleFormSubmit));
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
</script>
