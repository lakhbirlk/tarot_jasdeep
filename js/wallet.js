/* ==========================================================================
   wallet.js — demo credit wallet
   --------------------------------------------------------------------------
   IMPORTANT — this is a front-end demonstration only.

   * Credits, balances and transactions live in this browser's localStorage.
   * Anyone can edit or clear them, so this is NOT secure account enforcement
     and NOT a payment system. Nothing here charges money.
   * For production, balances must be stored and validated on a server, and
     payments must be confirmed by a payment provider (e.g. Razorpay, Stripe)
     through a webhook before credits are granted.

   Public API (window.TarotWallet):
     getCredits()                     -> number
     add(credits, label)              -> new balance
     spend(credits, label, options)   -> Promise<boolean>
     purchase(packageId)              -> Promise<boolean>
     getHistory()                     -> array of transactions
     reset()                          -> clears the demo wallet
     onChange(fn)                     -> subscribe to balance changes
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "djk.demo.wallet.v1";
  var STARTING_CREDITS = 30; // Demo credits so the reading flow can be tried.

  var memoryFallback = null; // Used when localStorage is unavailable.
  var listeners = [];

  /* ---------------------------------------------------------------- *
   * Storage helpers — every access is guarded (private mode, blocked
   * storage and cleared data must never break the page).
   * ---------------------------------------------------------------- */
  function storageAvailable() {
    try {
      var probe = "__djk_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  var HAS_STORAGE = storageAvailable();

  function emptyState() {
    return {
      credits: STARTING_CREDITS,
      createdAt: new Date().toISOString(),
      transactions: [
        {
          id: "welcome",
          date: new Date().toISOString(),
          label: "Welcome demo credits (not real money)",
          amount: STARTING_CREDITS,
          balance: STARTING_CREDITS
        }
      ]
    };
  }

  function normalise(raw) {
    if (!raw || typeof raw !== "object") return emptyState();
    var credits = Number(raw.credits);
    if (!isFinite(credits) || credits < 0) credits = 0;
    return {
      credits: Math.floor(credits),
      createdAt: raw.createdAt || new Date().toISOString(),
      transactions: Array.isArray(raw.transactions) ? raw.transactions : []
    };
  }

  var state = (function load() {
    if (!HAS_STORAGE) {
      memoryFallback = emptyState();
      return memoryFallback;
    }
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var fresh = emptyState();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return normalise(JSON.parse(raw));
    } catch (error) {
      memoryFallback = emptyState();
      return memoryFallback;
    }
  })();

  function persist() {
    if (memoryFallback === state || !HAS_STORAGE) {
      memoryFallback = state;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      memoryFallback = state;
    }
  }

  function notify() {
    for (var i = 0; i < listeners.length; i += 1) {
      try {
        listeners[i](state.credits, state);
      } catch (error) {
        /* a broken listener must not break the wallet */
      }
    }
  }

  function record(label, amount, balance) {
    state.transactions.unshift({
      id: "tx" + Date.now() + Math.random().toString(16).slice(2, 6),
      date: new Date().toISOString(),
      label: label,
      amount: amount,
      balance: balance
    });
    if (state.transactions.length > 60) state.transactions.length = 60;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return iso;
    }
  }

  /* ---------------------------------------------------------------- *
   * Rendering: header chip, wallet dashboard, package buttons
   * ---------------------------------------------------------------- */
  function renderChips() {
    var chips = document.querySelectorAll("[data-credit-chip]");
    for (var i = 0; i < chips.length; i += 1) {
      var valueEl = chips[i].querySelector("[data-credit-chip-value]");
      if (valueEl) valueEl.textContent = String(state.credits);
      chips[i].hidden = false;
      chips[i].setAttribute(
        "aria-label",
        state.credits + " demo credits in your wallet. View wallet and packages."
      );
    }
  }

  function renderDashboard() {
    var app = document.getElementById("wallet-app");
    if (!app) return;

    var balanceEl = app.querySelector("[data-wallet-balance]");
    if (balanceEl) balanceEl.textContent = String(state.credits);

    var tbody = app.querySelector("[data-wallet-history]");
    if (tbody) {
      if (!state.transactions.length) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="dim">No activity yet. Buy a demo package or start a reading.</td></tr>';
      } else {
        var rows = "";
        for (var i = 0; i < state.transactions.length; i += 1) {
          var tx = state.transactions[i];
          var sign = tx.amount > 0 ? "+" : "";
          var cls = tx.amount > 0 ? "amount-plus" : "amount-minus";
          rows +=
            "<tr>" +
              "<td>" + UI.escapeHtml(formatDate(tx.date)) + "</td>" +
              "<td>" + UI.escapeHtml(tx.label) + "</td>" +
              '<td class="num ' + cls + '">' + sign + tx.amount + "</td>" +
              '<td class="num">' + tx.balance + "</td>" +
            "</tr>";
        }
        tbody.innerHTML = rows;
      }
    }

    var storageNote = app.querySelector("[data-wallet-storage-note]");
    if (storageNote) {
      storageNote.textContent = HAS_STORAGE
        ? "This demo wallet is saved in this browser's localStorage and can be cleared at any time."
        : "This browser is blocking local storage, so the demo wallet is only kept for this page view.";
    }
  }

  function renderAll() {
    renderChips();
    renderDashboard();
  }

  /* ---------------------------------------------------------------- *
   * Public API
   * ---------------------------------------------------------------- */
  var Wallet = {};

  Wallet.storageAvailable = HAS_STORAGE;
  Wallet.startingCredits = STARTING_CREDITS;

  Wallet.getCredits = function () { return state.credits; };
  Wallet.getHistory = function () { return state.transactions.slice(); };
  Wallet.getState = function () { return state; };

  Wallet.onChange = function (fn) {
    if (typeof fn === "function") listeners.push(fn);
  };

  Wallet.add = function (credits, label) {
    var amount = Math.max(0, Math.floor(Number(credits) || 0));
    if (!amount) return state.credits;
    state.credits += amount;
    record(label || "Credits added", amount, state.credits);
    persist();
    renderAll();
    notify();
    return state.credits;
  };

  /**
   * Spend credits after an explicit confirmation.
   * Resolves true when the credits were deducted, false otherwise.
   */
  Wallet.spend = function (credits, label, options) {
    var opts = options || {};
    var amount = Math.max(0, Math.floor(Number(credits) || 0));

    if (!amount) return Promise.resolve(true);

    if (state.credits < amount) {
      if (opts.silent !== true) {
        UI.confirm({
          title: "Not enough credits",
          bodyHtml:
            "<p>This reading costs <strong>" + amount + " credits</strong> and your demo wallet holds " +
            "<strong>" + state.credits + "</strong>.</p>" +
            "<p>You can add demo credits from the Pricing &amp; Credits page. No real payment is taken " +
            "anywhere on this demo site.</p>",
          confirmLabel: "View packages",
          cancelLabel: "Not now"
        }).then(function (goToPricing) {
          if (goToPricing) window.location.href = "pricing.html#packages";
        });
      }
      return Promise.resolve(false);
    }

    var body =
      "<p><strong>" + UI.escapeHtml(label || "This reading") + "</strong> costs <strong>" + amount +
      " credits</strong>.</p>" +
      "<p>Demo balance after confirming: <strong>" + (state.credits - amount) + " credits</strong>.</p>" +
      '<p class="small dim">Demo credits only — no money is involved. Credits are stored in this browser.</p>';

    return UI.confirm({
      title: "Confirm your reading",
      bodyHtml: body,
      confirmLabel: "Confirm · " + amount + " credits",
      cancelLabel: "Cancel"
    }).then(function (confirmed) {
      if (!confirmed) return false;
      state.credits -= amount;
      record(label || "Reading", -amount, state.credits);
      persist();
      renderAll();
      notify();
      return true;
    });
  };

  /**
   * Demo "purchase". Explains clearly that no payment is processed.
   */
  Wallet.purchase = function (packageId) {
    var pkg = window.TAROT_CONFIG.getPackage(packageId);
    if (!pkg) return Promise.resolve(false);

    var price = window.TAROT_CONFIG.formatPrice(pkg.price);

    return UI.confirm({
      title: pkg.name + " package — " + pkg.credits + " credits",
      bodyHtml:
        "<p><strong>No payment is processed on this website.</strong> This is a front-end prototype: " +
        "the button below simply adds " + pkg.credits + " demonstration credits to your browser wallet so " +
        "you can test the reading flow.</p>" +
        "<p>Listed example price: <strong>" + price + "</strong> (placeholder). In production, checkout would " +
        "run through a payment provider such as Razorpay or Stripe, and credits would be granted only after " +
        "the server verifies the payment.</p>",
      confirmLabel: "Add " + pkg.credits + " demo credits",
      cancelLabel: "Cancel"
    }).then(function (confirmed) {
      if (!confirmed) return false;
      Wallet.add(pkg.credits, pkg.name + " package (demo credits)");
      UI.toast(pkg.credits + " demo credits added to your wallet.", "ok");
      return true;
    });
  };

  Wallet.reset = function () {
    return UI.confirm({
      title: "Reset the demo wallet?",
      bodyHtml:
        "<p>This clears the demo credits and the transaction history stored in this browser and starts again " +
        "with " + STARTING_CREDITS + " demo credits.</p>",
      confirmLabel: "Reset wallet",
      cancelLabel: "Keep my credits",
      confirmTone: "danger"
    }).then(function (confirmed) {
      if (!confirmed) return false;
      state = emptyState();
      persist();
      renderAll();
      notify();
      UI.toast("Demo wallet reset.", "warn");
      return true;
    });
  };

  window.TarotWallet = Wallet;

  /* ---------------------------------------------------------------- *
   * Wiring
   * ---------------------------------------------------------------- */
  function wire() {
    document.addEventListener("click", function (event) {
      var buy = event.target.closest("[data-buy-package]");
      if (buy) {
        event.preventDefault();
        Wallet.purchase(buy.getAttribute("data-buy-package"));
        return;
      }
      var reset = event.target.closest("[data-wallet-reset]");
      if (reset) {
        event.preventDefault();
        Wallet.reset();
      }
    });

    // Keep multiple open tabs in step.
    window.addEventListener("storage", function (event) {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        state = normalise(JSON.parse(event.newValue));
        renderAll();
        notify();
      } catch (error) {
        /* ignore malformed external writes */
      }
    });

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
