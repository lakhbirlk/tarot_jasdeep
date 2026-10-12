/* ==========================================================================
   booking.js — consultation booking form + contact form
   --------------------------------------------------------------------------
   These forms are front-end demonstrations. Nothing is transmitted anywhere:
   a static site has no server to receive it.

   To make them live, choose one:
     1. A form service (e.g. Formspree, Web3Forms, Netlify Forms) — set the
        form's action/method and remove the preventDefault below.
     2. Your own backend / serverless function that emails or stores bookings.

   Never place API keys or SMTP credentials in this file — it is public.
   ========================================================================== */
(function () {
  "use strict";

  var DRAFT_KEY = "djk.demo.bookingDraft.v1";

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  function findForm(id) {
    return document.getElementById(id);
  }

  function values(form) {
    var data = {};
    var fields = form.querySelectorAll("input, select, textarea");
    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (!field.name) continue;
      if (field.type === "checkbox") {
        data[field.name] = field.checked;
      } else if (field.type === "radio") {
        if (field.checked) data[field.name] = field.value;
      } else {
        data[field.name] = (field.value || "").trim();
      }
    }
    return data;
  }

  function describeBooking(data) {
    var rows = [
      ["Name", data.name],
      ["Email", data.email],
      ["Phone", data.phone],
      ["Reading type", data.readingType],
      ["Preferred date", data.date],
      ["Preferred time", data.time],
      ["Consultation mode", data.mode],
      ["Question or message", data.message || "—"]
    ];
    var html = '<table class="data" style="min-width:0"><tbody>';
    rows.forEach(function (row) {
      html +=
        "<tr><th scope=\"row\">" + UI.escapeHtml(row[0]) + "</th><td>" +
        UI.escapeHtml(row[1] || "—") + "</td></tr>";
    });
    return html + "</tbody></table>";
  }

  /* ------------------------------------------------------------------ *
   * Booking form
   * ------------------------------------------------------------------ */
  function initBookingForm() {
    var form = findForm("booking-form");
    if (!form) return;

    var dateInput = form.querySelector('input[type="date"]');
    if (dateInput) {
      dateInput.min = todayISO();
      try {
        // Restore an unfinished draft (name, email and preferences only —
        // never anything sensitive) so a reload does not lose the details.
        var raw = window.localStorage.getItem(DRAFT_KEY);
        if (raw) {
          var draft = JSON.parse(raw);
          Object.keys(draft).forEach(function (key) {
            var field = form.elements[key];
            if (!field || field.type === "checkbox") return;
            if (field.type === "radio") {
              var radios = form.querySelectorAll('input[name="' + key + '"]');
              for (var i = 0; i < radios.length; i += 1) {
                if (radios[i].value === draft[key]) radios[i].checked = true;
              }
            } else {
              field.value = draft[key];
            }
          });
          UI.status(
            form.querySelector("[data-form-status]"),
            "We restored the details you had typed earlier in this browser. Nothing has been sent yet.",
            "warn"
          );
        }
      } catch (error) {
        /* a blocked or malformed draft is not worth interrupting anyone for */
      }
    }

    var saveDraft = UI.debounce(function () {
      try {
        var data = values(form);
        delete data.password;
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      } catch (error) {
        /* ignore */
      }
    }, 500);

    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);

    var statusEl = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      UI.status(statusEl, "");

      if (!UI.validate(form)) return;

      var data = values(form);
      var summary = describeBooking(data);

      UI.confirm({
        title: "Check your booking request",
        bodyHtml:
          "<p>Here is what you have entered:</p>" + summary +
          "<p><strong>This demo does not send the request anywhere.</strong> Once the site is connected to a " +
          "backend or a form service, submitting will notify Dr. Jasdeep Kaur's team, who would then confirm " +
          "the appointment with you directly.</p>",
        confirmLabel: "Looks right",
        cancelLabel: "Edit details"
      }).then(function (ok) {
        if (!ok) return;

        var reference =
          "DEMO-" +
          new Date().toISOString().slice(0, 10).replace(/-/g, "") +
          "-" +
          Math.random().toString(36).slice(2, 6).toUpperCase();

        UI.status(
          statusEl,
          "<strong>Nothing was sent — this is a demo submission.</strong><br>" +
            "Your reference for this session is <strong>" + UI.escapeHtml(reference) + "</strong>. " +
            "Once the booking form is connected to a backend or form service, requests will be delivered to the " +
            "studio and confirmed by email. For a real appointment in the meantime, please write to " +
            "<span data-contact-email>" + UI.escapeHtml(window.TAROT_CONFIG.contact.email) + "</span>.",
          "ok"
        );

        try { window.localStorage.removeItem(DRAFT_KEY); } catch (error) { /* ignore */ }

        UI.toast("Demo booking recorded in this page only — not sent.", "warn", 6000);
        form.reset();
        if (dateInput) dateInput.min = todayISO();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Contact form
   * ------------------------------------------------------------------ */
  function initContactForm() {
    var form = findForm("contact-form");
    if (!form) return;

    var statusEl = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      UI.status(statusEl, "");

      if (!UI.validate(form)) return;

      var data = values(form);

      UI.confirm({
        title: "Send this message?",
        bodyHtml:
          "<p><strong>" + UI.escapeHtml(data.name) + "</strong> · " + UI.escapeHtml(data.email) + "</p>" +
          "<p>" + UI.escapeHtml(data.message).replace(/\n/g, "<br>") + "</p>" +
          "<p><strong>Note:</strong> this static demo cannot deliver messages. Connect the form to a form " +
          "service or your own backend, or email directly using the address in the contact panel.</p>",
        confirmLabel: "Understood",
        cancelLabel: "Go back"
      }).then(function (ok) {
        if (!ok) return;
        UI.status(
          statusEl,
          "<strong>Your message was not sent.</strong> This page has no backend yet, so nothing left your browser. " +
            "Please email <span data-contact-email>" + UI.escapeHtml(window.TAROT_CONFIG.contact.email) +
            "</span> or use WhatsApp until the form is connected.",
          "warn"
        );
        UI.toast("Demo only — the message was not delivered.", "warn", 6000);
        form.reset();
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Login & registration (demo, no credentials kept)
   * ------------------------------------------------------------------ */
  function initAuthForms() {
    var login = findForm("login-form");
    if (login) {
      var loginStatus = login.querySelector("[data-form-status]");
      login.addEventListener("submit", function (event) {
        event.preventDefault();
        UI.status(loginStatus, "");
        if (!UI.validate(login)) return;

        // The password is never stored, logged or transmitted anywhere.
        login.reset();
        UI.status(
          loginStatus,
          "<strong>Demo form — no account was accessed.</strong> Real sign-in needs a backend or an " +
            "authentication provider that stores password hashes securely, verifies email addresses and manages " +
            "sessions. Nothing you typed was saved.",
          "warn"
        );
        UI.toast("Demo sign-in form — nothing was submitted.", "warn", 6000);
      });
    }

    var register = findForm("register-form");
    if (register) {
      var registerStatus = register.querySelector("[data-form-status]");
      register.addEventListener("submit", function (event) {
        event.preventDefault();
        UI.status(registerStatus, "");
        if (!UI.validate(register)) return;

        var data = values(register);
        UI.confirm({
          title: "Create a demo account?",
          bodyHtml:
            "<p>Name: <strong>" + UI.escapeHtml(data.name) + "</strong><br>" +
            "Email: <strong>" + UI.escapeHtml(data.email) + "</strong></p>" +
            "<p><strong>No account will be created and your password is not stored anywhere.</strong> " +
            "Registration needs a backend or authentication provider to create the account, hash the password " +
            "and send a verification email. Only preferences such as a display name would ever be kept in the " +
            "browser — never passwords.</p>",
          confirmLabel: "I understand",
          cancelLabel: "Close"
        }).then(function (ok) {
          if (!ok) return;
          register.reset();
          UI.status(
            registerStatus,
            "<strong>Nothing was submitted and no password was saved.</strong> To go live, connect this form to " +
              "an authentication service, then add email verification, password reset and server-side validation.",
            "ok"
          );
        });
      });
    }

    var reset = findForm("forgot-form");
    if (reset) {
      var resetStatus = reset.querySelector("[data-form-status]");
      reset.addEventListener("submit", function (event) {
        event.preventDefault();
        UI.status(resetStatus, "");
        if (!UI.validate(reset)) return;
        reset.reset();
        UI.status(
          resetStatus,
          "<strong>Demo form.</strong> A real password reset sends a single-use, time-limited link by email from " +
            "the server. That is not possible without a backend, and no email was sent.",
          "warn"
        );
      });
    }
  }

  function init() {
    initBookingForm();
    initContactForm();
    initAuthForms();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
