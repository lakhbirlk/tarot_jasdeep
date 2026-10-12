/* ==========================================================================
   main.js — shared behaviour for every page
   --------------------------------------------------------------------------
   1. Site configuration (services, credit costs, packages, contact placeholders)
   2. Small UI kit: toasts, confirm modal, DOM helpers
   3. Form validation helpers
   4. Header, mobile navigation, active link, footer year
   5. Scroll reveal animations
   6. Renders configured costs/packages into the markup
   No dependencies. Safe to load on every page.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. SITE CONFIGURATION
   * ------------------------------------------------------------------
   * Everything marked PLACEHOLDER is an editable example value.
   * Credit costs and package prices are examples only — confirm the real
   * business figures before going live, then change them here once and
   * every page updates.
   * ------------------------------------------------------------------ */
  var TAROT_CONFIG = {
    brand: {
      name: "Dr. Jasdeep Kaur",
      tagline: "Tarot & Spiritual Guidance"
    },

    currency: {
      code: "INR",
      symbol: "₹",
      // PLACEHOLDER pricing. Not a payment page — see README.
      note: "Placeholder prices for development. Confirm final pricing before publishing."
    },

    /**
     * Reading services.
     *  id       — matches data-service attributes in the markup and the
     *             ?service= URL parameter used by the reading experience
     *  cards    — how many cards the spread draws
     *  credits  — PLACEHOLDER credit cost per reading
     *  duration — PLACEHOLDER estimated duration
     */
    services: {
      love:            { name: "Love & Relationship Tarot",   cards: 3, credits: 20, duration: "15 min" },
      career:          { name: "Career & Finance Tarot",      cards: 3, credits: 20, duration: "15 min" },
      "three-card":    { name: "Three-Card Tarot Reading",    cards: 3, credits: 15, duration: "10 min" },
      "yes-no":        { name: "Yes / No Tarot",              cards: 1, credits: 10, duration: "5 min"  },
      angel:           { name: "Angel Card Reading",          cards: 1, credits: 10, duration: "5 min"  },
      consultation:    { name: "Personalized Tarot Consultation", cards: 3, credits: 60, duration: "45 min" }
    },

    /** Card positions per service (used by the reading experience). */
    spreads: {
      love:         ["Where your heart is now", "The connection between you", "Gentle guidance"],
      career:       ["Your current situation", "The opportunity or challenge", "A suggested next step"],
      "three-card": ["Past", "Present", "Possible direction ahead"],
      "yes-no":     ["Your card"],
      angel:        ["Today's angel message"],
      consultation: ["What you are bringing", "What to notice", "What may help"]
    },

    /** Credit packages. PLACEHOLDER prices — connect a payment provider first. */
    packages: [
      { id: "starter",   name: "Starter",   credits: 50,  price: 499,  best: false,
        perks: ["Enough for three three-card readings", "Kept in your browser wallet until you reset it"] },
      { id: "explorer",  name: "Explorer",  credits: 150, price: 1299, best: false,
        perks: ["Around ten three-card readings", "Good for regular reflection"] },
      { id: "premium",   name: "Premium",   credits: 350, price: 2799, best: true,
        perks: ["Around twenty-three three-card readings", "A balance of cost and flexibility"] },
      { id: "exclusive", name: "Exclusive", credits: 800, price: 5999, best: false,
        perks: ["Over fifty three-card readings", "Lowest cost per credit"] }
    ],

    /** PLACEHOLDER contact details — replace with the real business information. */
    contact: {
      email: "hello@example.com",
      phone: "+00 00000 00000",
      whatsapp: "+00 00000 00000",
      hours: "Monday to Saturday, 10:00 – 19:00 (IST)",
      locationPlaceholder: "Add city / country if you wish to display it"
    }
  };

  window.TAROT_CONFIG = TAROT_CONFIG;

  TAROT_CONFIG.getService = function (id) {
    return Object.prototype.hasOwnProperty.call(TAROT_CONFIG.services, id)
      ? TAROT_CONFIG.services[id]
      : null;
  };

  TAROT_CONFIG.getPackage = function (id) {
    for (var i = 0; i < TAROT_CONFIG.packages.length; i += 1) {
      if (TAROT_CONFIG.packages[i].id === id) return TAROT_CONFIG.packages[i];
    }
    return null;
  };

  TAROT_CONFIG.formatPrice = function (amount) {
    var c = TAROT_CONFIG.currency;
    var rounded = Math.round(Number(amount) || 0);
    return c.symbol + rounded.toLocaleString("en-IN");
  };

  /* ------------------------------------------------------------------ *
   * 2. UI KIT
   * ------------------------------------------------------------------ */
  var UI = {};

  UI.escapeHtml = function (value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  UI.toastRegion = function () {
    var region = document.getElementById("toast-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "toast-region";
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  };

  /** Transient message. type: "ok" | "warn" | "error" | "info" */
  UI.toast = function (message, type, timeout) {
    var region = UI.toastRegion();
    var el = document.createElement("div");
    el.className = "toast toast--" + (type || "ok");
    el.innerHTML = '<span aria-hidden="true">✦</span><span>' + UI.escapeHtml(message) + "</span>";
    region.appendChild(el);

    var remove = function () {
      if (!el.parentNode) return;
      el.classList.add("is-leaving");
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 240);
    };
    window.setTimeout(remove, typeof timeout === "number" ? timeout : 4200);
    el.addEventListener("click", remove);
    return el;
  };

  /**
   * Accessible confirmation dialog.
   * Returns a Promise that resolves to true (confirmed) or false (dismissed).
   */
  UI.confirm = function (options) {
    var opts = options || {};
    return new Promise(function (resolve) {
      var previousFocus = document.activeElement;

      var overlay = document.createElement("div");
      overlay.className = "modal";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "ui-modal-title");

      var safeTitle = UI.escapeHtml(opts.title || "Please confirm");
      var safeBody = opts.bodyHtml || UI.escapeHtml(opts.body || "");
      var confirmLabel = UI.escapeHtml(opts.confirmLabel || "Confirm");
      var cancelLabel = UI.escapeHtml(opts.cancelLabel || "Cancel");
      var confirmClass = opts.confirmTone === "danger" ? "btn btn--ghost" : "btn btn--primary";

      overlay.innerHTML =
        '<div class="modal__panel" role="document">' +
          '<h2 class="modal__title" id="ui-modal-title">' + safeTitle + "</h2>" +
          '<div class="modal__body">' + safeBody + "</div>" +
          '<div class="modal__actions">' +
            '<button type="button" class="btn btn--ghost" data-modal-cancel>' + cancelLabel + "</button>" +
            '<button type="button" class="' + confirmClass + '" data-modal-confirm>' + confirmLabel + "</button>" +
          "</div>" +
        "</div>";

      document.body.appendChild(overlay);
      window.requestAnimationFrame(function () { overlay.classList.add("is-open"); });

      var confirmBtn = overlay.querySelector("[data-modal-confirm]");
      var cancelBtn = overlay.querySelector("[data-modal-cancel]");
      var panel = overlay.querySelector(".modal__panel");

      var close = function (result) {
        overlay.classList.remove("is-open");
        document.removeEventListener("keydown", onKeydown, true);
        window.setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          if (previousFocus && previousFocus.focus) previousFocus.focus();
          resolve(result);
        }, 240);
      };

      function onKeydown(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          close(false);
        } else if (event.key === "Tab") {
          var focusables = panel.querySelectorAll("button, [href], input, select, textarea");
          if (!focusables.length) return;
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }

      confirmBtn.addEventListener("click", function () { close(true); });
      cancelBtn.addEventListener("click", function () { close(false); });
      overlay.addEventListener("mousedown", function (event) {
        if (event.target === overlay) close(false);
      });
      document.addEventListener("keydown", onKeydown, true);

      confirmBtn.focus();
    });
  };

  /** Simple informational dialog (single dismiss button). */
  UI.alert = function (options) {
    var opts = options || {};
    return UI.confirm({
      title: opts.title || "Note",
      bodyHtml: opts.bodyHtml || UI.escapeHtml(opts.body || ""),
      confirmLabel: opts.confirmLabel || "Got it",
      cancelLabel: "Close"
    });
  };

  UI.debounce = function (fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var self = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(self, args); }, wait || 150);
    };
  };

  window.UI = UI;

  /* ------------------------------------------------------------------ *
   * 3. FORM VALIDATION
   * ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  // Deliberately permissive: 7–15 digits, optional leading +, spaces allowed.
  var PHONE_RE = /^\+?[0-9][0-9\s\-()]{5,19}$/;

  var Validator = {};

  Validator.messageFor = function (field) {
    var value = (field.value || "").trim();
    var rules = field.getAttribute("data-validate") || "";
    var label = field.getAttribute("data-label") || field.name || "This field";

    if (field.type === "checkbox") {
      return field.checked ? "" : "Please tick this box to continue.";
    }
    if (!value) {
      return field.getAttribute("data-required-message") || "Please fill in " + label.toLowerCase() + ".";
    }
    if (rules.indexOf("name") > -1 && value.length < 2) {
      return "Please enter at least 2 characters.";
    }
    if (field.type === "email" || rules.indexOf("email") > -1) {
      return EMAIL_RE.test(value) ? "" : "Please enter a valid email address, for example name@example.com.";
    }
    if (rules.indexOf("phone") > -1 && !PHONE_RE.test(value)) {
      return "Please enter a valid phone number including country code.";
    }
    if (rules.indexOf("password") > -1) {
      if (value.length < 8) return "Use at least 8 characters.";
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return "Include at least one letter and one number.";
      }
    }
    if (rules.indexOf("date") > -1) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var picked = new Date(value + "T00:00:00");
      if (isNaN(picked.getTime())) return "Please choose a valid date.";
      if (picked < today) return "Please choose today or a later date.";
    }
    var matchSel = field.getAttribute("data-match");
    if (matchSel) {
      var other = document.querySelector(matchSel);
      if (other && other.value !== field.value) return "The two values do not match.";
    }
    var min = parseInt(field.getAttribute("minlength"), 10);
    if (!isNaN(min) && value.length < min) {
      return "Please use at least " + min + " characters.";
    }
    return "";
  };

  Validator.setError = function (field, message) {
    var wrapper = field.closest(".field") || field.parentNode;
    var errorEl = wrapper.querySelector(".field-error");
    if (wrapper.classList.contains("field")) {
      wrapper.setAttribute("data-invalid", message ? "true" : "false");
    }
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
    if (errorEl) {
      errorEl.textContent = message || "";
      if (message && !errorEl.id) {
        errorEl.id = (field.id || field.name || "field") + "-error";
      }
      if (message && errorEl.id) field.setAttribute("aria-describedby", errorEl.id);
      else field.removeAttribute("aria-describedby");
    }
  };

  /**
   * Validate a form. Returns true when everything is valid, otherwise it
   * marks the invalid fields, focuses the first one and returns false.
   */
  Validator.validate = function (form) {
    var fields = form.querySelectorAll("[data-validate], [required]");
    var firstInvalid = null;
    var i;

    for (i = 0; i < fields.length; i += 1) {
      var message = Validator.messageFor(fields[i]);
      Validator.setError(fields[i], message);
      if (message && !firstInvalid) firstInvalid = fields[i];
    }

    if (firstInvalid) {
      firstInvalid.focus();
      if (firstInvalid.scrollIntoView) {
        firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      UI.toast("Please check the highlighted fields.", "error");
      return false;
    }
    return true;
  };

  /** Clear a field's error as soon as the visitor starts fixing it. */
  Validator.attach = function (form) {
    if (!form || form.dataset.validationReady === "true") return;
    form.dataset.validationReady = "true";
    form.setAttribute("novalidate", "novalidate");

    form.addEventListener(
      "blur",
      function (event) {
        var field = event.target;
        if (!field.matches("[data-validate], [required]")) return;
        Validator.setError(field, Validator.messageFor(field));
      },
      true
    );

    form.addEventListener(
      "input",
      function (event) {
        var field = event.target;
        if (!field.matches("[data-validate], [required]")) return;
        if (field.getAttribute("aria-invalid") === "true") {
          Validator.setError(field, Validator.messageFor(field));
        }
      },
      true
    );

    form.addEventListener(
      "change",
      function (event) {
        var field = event.target;
        if (field.type === "checkbox" && field.getAttribute("aria-invalid") === "true") {
          Validator.setError(field, Validator.messageFor(field));
        }
      },
      true
    );
  };

  UI.Validator = Validator;
  UI.validate = Validator.validate;
  UI.attachValidation = Validator.attach;

  /** Show a status message block inside a form. */
  UI.status = function (element, message, tone) {
    if (!element) return;
    if (!message) {
      element.hidden = true;
      element.textContent = "";
      return;
    }
    element.hidden = false;
    element.className = "form-status form-status--" + (tone || "ok");
    element.innerHTML = message;
  };

  /* ------------------------------------------------------------------ *
   * 4. HEADER, NAVIGATION, FOOTER YEAR
   * ------------------------------------------------------------------ */
  function currentPage() {
    var path = window.location.pathname.split("/").pop();
    return path && path.length ? path : "index.html";
  }

  function initHeader() {
    var header = document.getElementById("site-header");
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 12) header.classList.add("is-scrolled");
        else header.classList.remove("is-scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var page = currentPage();
    var links = document.querySelectorAll(".nav-list a[href]");
    for (var i = 0; i < links.length; i += 1) {
      var target = links[i].getAttribute("href").split("#")[0];
      if (target === page) {
        links[i].setAttribute("aria-current", "page");
      } else {
        links[i].removeAttribute("aria-current");
      }
    }
  }

  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    var backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    backdrop.hidden = false;
    document.body.appendChild(backdrop);

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.classList.toggle("is-open", open);
      backdrop.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      if (open) {
        var first = nav.querySelector("a, button");
        if (first) first.focus();
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    backdrop.addEventListener("click", function () { setOpen(false); });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset the panel state if the viewport grows back to desktop width.
    window.addEventListener(
      "resize",
      UI.debounce(function () {
        if (window.innerWidth > 1099 && toggle.getAttribute("aria-expanded") === "true") {
          setOpen(false);
        }
      }, 160)
    );
  }

  function initFooterYear() {
    var nodes = document.querySelectorAll("[data-current-year]");
    var year = String(new Date().getFullYear());
    for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = year;
  }

  /** Keep in-page anchors clear of the sticky header. */
  function initAnchorOffset() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute("href");
      if (!hash || hash === "#" || hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      var header = document.getElementById("site-header");
      var offset = (header ? header.offsetHeight : 0) + 18;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      if (history.replaceState) history.replaceState(null, "", hash);
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. SCROLL REVEAL
   * ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i += 1) items[i].classList.add("is-visible");
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var delay = parseInt(entry.target.getAttribute("data-reveal-delay") || "0", 10);
          window.setTimeout(function () {
            entry.target.classList.add("is-visible");
          }, isNaN(delay) ? 0 : delay);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (var j = 0; j < items.length; j += 1) observer.observe(items[j]);
  }

  /* ------------------------------------------------------------------ *
   * 6. CONFIGURED COSTS & PACKAGES IN THE MARKUP
   *    Single source of truth: TAROT_CONFIG above.
   * ------------------------------------------------------------------ */

  /** <span data-cost-for="love"></span> → "20 credits · approx. 15 min" */
  function renderCostBadges() {
    var nodes = document.querySelectorAll("[data-cost-for]");
    for (var i = 0; i < nodes.length; i += 1) {
      var service = TAROT_CONFIG.getService(nodes[i].getAttribute("data-cost-for"));
      if (!service) continue;
      nodes[i].textContent = service.credits + " credits · approx. " + service.duration;
    }
  }

  /** <article class="package" data-package="starter"> … </article> */
  function renderPackages() {
    var cards = document.querySelectorAll("[data-package]");
    for (var i = 0; i < cards.length; i += 1) {
      var pkg = TAROT_CONFIG.getPackage(cards[i].getAttribute("data-package"));
      if (!pkg) continue;

      var creditsEl = cards[i].querySelector("[data-package-credits]");
      var priceEl = cards[i].querySelector("[data-package-price]");
      var nameEl = cards[i].querySelector("[data-package-name]");
      var buyBtn = cards[i].querySelector("[data-buy-package]");

      if (creditsEl) creditsEl.textContent = String(pkg.credits);
      if (priceEl) priceEl.textContent = TAROT_CONFIG.formatPrice(pkg.price);
      if (nameEl && !nameEl.textContent.trim()) nameEl.textContent = pkg.name;
      if (buyBtn) {
        buyBtn.setAttribute("data-buy-package", pkg.id);
        buyBtn.setAttribute(
          "aria-label",
          "Buy the " + pkg.name + " package: " + pkg.credits + " credits for " + TAROT_CONFIG.formatPrice(pkg.price)
        );
      }
      cards[i].classList.toggle("package--featured", !!pkg.best);
      var tag = cards[i].querySelector("[data-package-tag]");
      if (tag) tag.hidden = !pkg.best;
    }
  }

  /** Fill documented contact placeholders from config (single place to edit). */
  function renderContactPlaceholders() {
    var map = {
      "[data-contact-email]": TAROT_CONFIG.contact.email,
      "[data-contact-phone]": TAROT_CONFIG.contact.phone,
      "[data-contact-whatsapp]": TAROT_CONFIG.contact.whatsapp,
      "[data-contact-hours]": TAROT_CONFIG.contact.hours
    };
    Object.keys(map).forEach(function (selector) {
      var nodes = document.querySelectorAll(selector);
      for (var i = 0; i < nodes.length; i += 1) nodes[i].textContent = map[selector];
    });
  }

  /* ------------------------------------------------------------------ *
   * BOOTSTRAP
   * ------------------------------------------------------------------ */
  function init() {
    initHeader();
    initMobileNav();
    initFooterYear();
    initAnchorOffset();
    initReveal();
    renderCostBadges();
    renderPackages();
    renderContactPlaceholders();

    var forms = document.querySelectorAll("form[data-validated]");
    for (var i = 0; i < forms.length; i += 1) Validator.attach(forms[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
