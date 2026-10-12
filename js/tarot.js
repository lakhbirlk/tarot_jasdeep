/* ==========================================================================
   tarot.js — card data, interactive reading flow, daily tarot
   --------------------------------------------------------------------------
   1. The sample deck (12 Major Arcana cards + original interpretations)
   2. Reading experience state machine (choose → focus → draw → read)
   3. Saved readings (localStorage, clearly a demo convenience)
   4. Daily tarot (one card per day, demo reset available)

   Honesty notes kept deliberately visible in the UI:
   * Card selection is randomised fairly (crypto-backed Fisher–Yates shuffle).
   * Interpretations are reflective prompts, not predictions, and are not
     legal, medical, financial or psychological advice.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. SAMPLE DECK
   * ------------------------------------------------------------------
   * A 12-card sample of the Major Arcana. To extend the deck, add another
   * object here and drop a matching SVG into assets/tarot-cards/.
   * ------------------------------------------------------------------ */
  var DECK = [
    {
      id: "the-fool",
      name: "The Fool",
      numeral: "0",
      element: "Air",
      art: "assets/tarot-cards/the-fool.svg",
      keywords: ["Beginnings", "Innocence", "A leap of faith"],
      general:
        "The Fool stands at the edge of something new, travelling light. It speaks of curiosity, fresh starts and the willingness to begin before every detail is known.",
      love:
        "A new connection or a fresh chapter may be asking for openness rather than guarantees. It is a nudge to stay curious, keep your boundaries, and let a relationship reveal itself at its own pace.",
      career:
        "An unfamiliar path can look more inviting than the safe one. This card invites an honest look at what you would try if you were less afraid of looking inexperienced.",
      reflection:
        "Where in your life are you waiting to feel completely ready before you begin?",
      affirmation: "I can begin before I feel certain, and learn as I go.",
      yesNo: { lean: "open", note: "The Fool rarely answers with a flat yes or no — it points to an unknown that is worth exploring." }
    },
    {
      id: "the-magician",
      name: "The Magician",
      numeral: "I",
      element: "Air",
      art: "assets/tarot-cards/the-magician.svg",
      keywords: ["Resourcefulness", "Focus", "Making it real"],
      general:
        "The Magician gathers scattered tools and turns intention into action. It is the card of focus, skill and the quiet confidence of someone who uses what is already at hand.",
      love:
        "Communication is the theme here: what you say, how clearly you say it, and whether your actions match your words. Honest conversation may shift more than silence will.",
      career:
        "Skills you may be underrating are worth naming out loud. This card favours preparation, clear proposals and following through on the one thing you have been circling.",
      reflection:
        "Which of your existing strengths are you not yet using fully?",
      affirmation: "I have more to work with than I give myself credit for.",
      yesNo: { lean: "yes", note: "Leaning yes — though the outcome depends on the effort and clarity you bring to it." }
    },
    {
      id: "the-high-priestess",
      name: "The High Priestess",
      numeral: "II",
      element: "Water",
      art: "assets/tarot-cards/the-high-priestess.svg",
      keywords: ["Intuition", "Stillness", "Inner knowing"],
      general:
        "The High Priestess sits between what is spoken and what is felt. She suggests that some answers arrive in quiet, and that not everything needs to be decided today.",
      love:
        "Feelings may be present that nobody has said out loud yet. This card favours patience, listening to your own instincts, and not rushing a conversation before you are steady.",
      career:
        "All the information may not be visible yet. It is a good moment to observe, ask careful questions and trust the reservations you cannot quite explain.",
      reflection:
        "What do you already sense about this situation that you have not admitted to yourself?",
      affirmation: "I trust the quiet sense of knowing beneath my thoughts.",
      yesNo: { lean: "open", note: "The answer is not clear yet — the card asks for more time and honest self-reflection before deciding." }
    },
    {
      id: "the-empress",
      name: "The Empress",
      numeral: "III",
      element: "Earth",
      art: "assets/tarot-cards/the-empress.svg",
      keywords: ["Nurture", "Abundance", "Patience"],
      general:
        "The Empress is the card of care, growth and slow ripening. She points to what flourishes when it is tended rather than forced.",
      love:
        "Warmth, generosity and everyday care are the themes. It is a reminder that relationships grow through consistent small kindnesses as much as through grand gestures.",
      career:
        "Ideas may need feeding before they can be shown. Creative work, collaboration and patient development are favoured over rushing to a result.",
      reflection:
        "What in your life needs patient tending rather than pushing?",
      affirmation: "I tend what matters to me steadily, and let it grow in its own time.",
      yesNo: { lean: "yes", note: "Leaning yes — the emphasis is on nurture and patience rather than speed." }
    },
    {
      id: "the-emperor",
      name: "The Emperor",
      numeral: "IV",
      element: "Fire",
      art: "assets/tarot-cards/the-emperor.svg",
      keywords: ["Structure", "Boundaries", "Responsibility"],
      general:
        "The Emperor brings order, boundaries and steady authority. He is less about control for its own sake and more about building something that can hold weight.",
      love:
        "Clear boundaries and reliable consistency matter more than intensity here. It can be worth naming what you need and what you will not accept, kindly but plainly.",
      career:
        "Structure, planning and accountability are the assets in play. Systems, timelines and clear agreements may serve you better than extra effort alone.",
      reflection:
        "Where would a clear boundary or a simple plan give you more peace?",
      affirmation: "I can be both kind and clear about my limits.",
      yesNo: { lean: "yes", note: "Leaning yes — with the condition that structure and follow-through are part of the answer." }
    },
    {
      id: "the-lovers",
      name: "The Lovers",
      numeral: "VI",
      element: "Air",
      art: "assets/tarot-cards/the-lovers.svg",
      keywords: ["Connection", "Choice", "Values"],
      general:
        "The Lovers is about union and honest choice — the moment where values, not convenience, decide the direction taken.",
      love:
        "Connection and alignment are central: whether two people are actually choosing each other, and whether the relationship matches what you value. It also invites you to be honest about your own part in the dynamic.",
      career:
        "A decision may come down to what you value rather than what looks impressive. Partnership and collaboration are highlighted, along with what you are willing to commit to.",
      reflection:
        "Which choice in front of you reflects your values rather than your fears?",
      affirmation: "I choose what aligns with who I am becoming.",
      yesNo: { lean: "yes", note: "Leaning yes — especially where the choice is made honestly and from genuine alignment." }
    },
    {
      id: "the-chariot",
      name: "The Chariot",
      numeral: "VII",
      element: "Water",
      art: "assets/tarot-cards/the-chariot.svg",
      keywords: ["Momentum", "Willpower", "Direction"],
      general:
        "The Chariot is forward motion held together by will. It speaks of steering competing pulls in one direction instead of being dragged by them.",
      love:
        "Effort and intention keep things moving. It may be worth asking whether you and the other person are travelling in the same direction, and what you are each willing to do about it.",
      career:
        "Determination and follow-through are favoured, particularly where you have been pulled in several directions at once. Progress may come from choosing one lane.",
      reflection:
        "What would change if you committed fully to one direction?",
      affirmation: "I choose my direction and give it my steady attention.",
      yesNo: { lean: "yes", note: "Leaning yes — momentum favours you, provided the effort is sustained and focused." }
    },
    {
      id: "strength",
      name: "Strength",
      numeral: "VIII",
      element: "Fire",
      art: "assets/tarot-cards/strength.svg",
      keywords: ["Courage", "Gentleness", "Self-command"],
      general:
        "Strength is quiet courage — influence through patience and self-command rather than force. It is the card of holding steady when something wild or difficult is close.",
      love:
        "Patience and emotional steadiness matter more than winning an argument. It invites compassion for the other person and for yourself, including the parts that react before they think.",
      career:
        "Composure under pressure is your advantage. Difficult conversations and slow-moving situations are better handled with calm persistence than with a push.",
      reflection:
        "Where could gentleness achieve what force has not?",
      affirmation: "I meet difficulty with patience rather than force.",
      yesNo: { lean: "yes", note: "Leaning yes — through patience and steady self-command rather than pressure." }
    },
    {
      id: "the-hermit",
      name: "The Hermit",
      numeral: "IX",
      element: "Earth",
      art: "assets/tarot-cards/the-hermit.svg",
      keywords: ["Reflection", "Solitude", "Inner light"],
      general:
        "The Hermit withdraws to see clearly. The card values honest solitude — not isolation for its own sake, but enough quiet to hear your own thinking.",
      love:
        "Some clarity may come from space rather than from more conversation. It can be a season to understand your own needs before negotiating them with someone else.",
      career:
        "Step back before stepping up. Reviewing what you have learned, and seeking counsel from someone experienced, may be more useful than acting immediately.",
      reflection:
        "What would you hear if you gave yourself an hour of quiet about this?",
      affirmation: "I make room for quiet, and I trust what I find there.",
      yesNo: { lean: "open", note: "Not a clear yes or no — the card asks for reflection and possibly a trusted second opinion first." }
    },
    {
      id: "wheel-of-fortune",
      name: "Wheel of Fortune",
      numeral: "X",
      element: "Fire",
      art: "assets/tarot-cards/wheel-of-fortune.svg",
      keywords: ["Cycles", "Change", "Timing"],
      general:
        "The Wheel turns: circumstances shift, and some of that is simply timing rather than personal failing or victory. It points to cycles and the value of adapting.",
      love:
        "The dynamic may be entering a new phase, for better or worse, and much of it is outside either person's control. What you can choose is how you respond to the change.",
      career:
        "Timing and circumstance are moving. It is a good moment to stay flexible, keep options open and notice which way the situation is already leaning.",
      reflection:
        "What is changing right now that you could work with instead of resisting?",
      affirmation: "I stay flexible through changing seasons.",
      yesNo: { lean: "open", note: "The Wheel resists a fixed answer — the situation is still in motion and timing matters." }
    },
    {
      id: "the-star",
      name: "The Star",
      numeral: "XVII",
      element: "Air",
      art: "assets/tarot-cards/the-star.svg",
      keywords: ["Hope", "Healing", "Clarity"],
      general:
        "The Star follows difficulty with calm hope. It is the card of gentle recovery, honest perspective and the return of belief in what is possible.",
      love:
        "Healing and honest hope are the themes — including the possibility that healing happens whether or not a particular relationship continues. Kindness toward yourself is part of the reading.",
      career:
        "A clearer sense of direction may return after a demanding period. Long-term aims look more appealing than quick wins, and your instincts about them are worth trusting.",
      reflection:
        "What would you hope for if you believed it were possible?",
      affirmation: "I allow hope to return, quietly and at my own pace.",
      yesNo: { lean: "yes", note: "Leaning yes — with a hopeful, unhurried tone rather than an urgent one." }
    },
    {
      id: "the-sun",
      name: "The Sun",
      numeral: "XIX",
      element: "Fire",
      art: "assets/tarot-cards/the-sun.svg",
      keywords: ["Clarity", "Warmth", "Joy"],
      general:
        "The Sun is openness, warmth and things becoming clear. It favours honesty, simple pleasures and situations where nothing needs to be hidden.",
      love:
        "Clarity and warmth are supported — enjoying the relationship as it is, and being straightforward about what you feel, tend to work better than games.",
      career:
        "Visibility and recognition are highlighted. Progress may come from showing your work openly and letting people see what you are capable of.",
      reflection:
        "What would you do differently if you stopped hiding this part of yourself?",
      affirmation: "I let my warmth and honesty be seen.",
      yesNo: { lean: "yes", note: "Leaning yes — a clear, open tone, with the encouragement to be straightforward." }
    }
  ];

  window.TAROT_DECK = DECK;

  function findCard(id) {
    for (var i = 0; i < DECK.length; i += 1) if (DECK[i].id === id) return DECK[i];
    return null;
  }

  /* ------------------------------------------------------------------ *
   * Fair random helpers
   * ------------------------------------------------------------------ */
  function randomInt(max) {
    if (max <= 0) return 0;
    if (window.crypto && window.crypto.getRandomValues) {
      var limit = Math.floor(0xffffffff / max) * max;
      var buf = new Uint32Array(1);
      var value;
      do {
        window.crypto.getRandomValues(buf);
        value = buf[0];
      } while (value >= limit);
      return value % max;
    }
    return Math.floor(Math.random() * max);
  }

  /** Unbiased Fisher–Yates shuffle over a copy of the array. */
  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = randomInt(i + 1);
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function pickRandom(list) {
    return list[randomInt(list.length)];
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

  function todayKey() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, "0");
    var day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
  }

  /* ================================================================== *
   * 2. READING EXPERIENCE
   * ================================================================== */
  function initReader() {
    var app = document.getElementById("reading-app");
    if (!app) return;

    var steps = {
      choose: app.querySelector('[data-step="choose"]'),
      focus: app.querySelector('[data-step="focus"]'),
      draw: app.querySelector('[data-step="draw"]'),
      result: app.querySelector('[data-step="result"]')
    };
    if (!steps.choose || !steps.focus || !steps.draw || !steps.result) return;

    var stepperItems = app.querySelectorAll(".stepper li");
    var serviceLabel = app.querySelector("[data-service-label]");
    var serviceCost = app.querySelector("[data-service-cost]");
    var serviceDuration = app.querySelector("[data-service-duration]");
    var deckEl = app.querySelector("#deck");
    var selectionCount = app.querySelector("[data-selection-count]");
    var requiredCount = app.querySelector("[data-required-count]");
    var revealBtn = app.querySelector("[data-reveal-btn]");
    var spreadEl = app.querySelector("[data-spread]");
    var summaryEl = app.querySelector("[data-summary]");
    var resultTitle = app.querySelector("[data-result-title]");
    var questionEcho = app.querySelector("[data-question-echo]");
    var questionField = app.querySelector("#reading-question");
    var drawHint = app.querySelector("[data-draw-hint]");
    var savedList = document.querySelector("[data-saved-readings]");

    var state = {
      serviceId: null,
      question: "",
      picks: [],
      revealed: false,
      order: [],
      lastReading: null
    };

    /* ---------------- step navigation ---------------- */
    function goToStep(name) {
      Object.keys(steps).forEach(function (key) {
        steps[key].hidden = key !== name;
      });
      for (var i = 0; i < stepperItems.length; i += 1) {
        if (stepperItems[i].getAttribute("data-step-label") === name) {
          stepperItems[i].setAttribute("aria-current", "step");
        } else {
          stepperItems[i].removeAttribute("aria-current");
        }
      }
      var heading = steps[name].querySelector("h3, h2");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
      var appTop = app.getBoundingClientRect().top + window.scrollY - 100;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(appTop, 0), behavior: reduce ? "auto" : "smooth" });
    }

    function applyService(id, keepQuestion) {
      var service = window.TAROT_CONFIG.getService(id);
      if (!service) return false;
      state.serviceId = id;
      state.picks = [];
      state.revealed = false;
      if (!keepQuestion) state.question = "";

      if (serviceLabel) serviceLabel.textContent = service.name;
      if (serviceCost) serviceCost.textContent = service.credits + " credits";
      if (serviceDuration) serviceDuration.textContent = "approx. " + service.duration;
      if (requiredCount) requiredCount.textContent = String(service.cards);
      if (drawHint) {
        drawHint.textContent =
          "Choose " +
          service.cards +
          (service.cards === 1 ? " card" : " cards") +
          " from the deck below. The deck is shuffled in your browser each time.";
      }

      var choices = app.querySelectorAll("[data-choose-service]");
      for (var i = 0; i < choices.length; i += 1) {
        choices[i].classList.toggle("is-active", choices[i].getAttribute("data-choose-service") === id);
        choices[i].setAttribute(
          "aria-pressed",
          choices[i].getAttribute("data-choose-service") === id ? "true" : "false"
        );
      }

      buildDeck(service.cards);
      return true;
    }

    /* ---------------- deck ---------------- */
    function buildDeck(required) {
      if (!deckEl) return;
      state.order = shuffle(DECK);
      var html = "";
      for (var i = 0; i < state.order.length; i += 1) {
        var card = state.order[i];
        html +=
          '<li><button type="button" class="deck-card" data-card-id="' + card.id + '"' +
          ' aria-pressed="false" aria-label="Face-down card ' + (i + 1) + ' of ' + state.order.length +
          ' — activate to select">' +
            '<span class="deck-card__inner">' +
              '<span class="deck-card__face deck-card__face--back">' +
                '<img src="assets/tarot-cards/card-back.svg" alt="" width="500" height="840" loading="lazy" decoding="async">' +
              "</span>" +
              '<span class="deck-card__face deck-card__face--front">' +
                '<img src="' + card.art + '" alt="' + UI.escapeHtml(card.name) + ' tarot card" width="500" height="840" loading="lazy" decoding="async">' +
              "</span>" +
            "</span>" +
            '<span class="deck-card__check" aria-hidden="true">✓</span>' +
          "</button></li>";
      }
      deckEl.innerHTML = html;
      updateCounter(required);
    }

    function updateCounter(required) {
      if (selectionCount) selectionCount.textContent = String(state.picks.length);
      if (revealBtn) revealBtn.disabled = state.picks.length !== required;
      if (revealBtn) {
        revealBtn.textContent =
          state.picks.length === required
            ? "Reveal my reading"
            : "Select " + (required - state.picks.length) + " more";
      }
    }

    function toggleCard(button) {
      if (state.revealed) return;
      var service = window.TAROT_CONFIG.getService(state.serviceId);
      if (!service) return;
      var id = button.getAttribute("data-card-id");
      var index = state.picks.indexOf(id);

      if (index > -1) {
        state.picks.splice(index, 1);
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
      } else if (state.picks.length < service.cards) {
        state.picks.push(id);
        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
      } else {
        UI.toast(
          "You have already chosen " + service.cards + ". Tap a chosen card to swap it out.",
          "warn"
        );
        return;
      }

      var remaining = service.cards - state.picks.length;
      if (remaining === 0) {
        UI.toast("All cards chosen. Reveal when you are ready.", "ok", 3000);
      }
      updateCounter(service.cards);
    }

    /* ---------------- interpretations ---------------- */
    function contextualText(card, serviceId, positionIndex) {
      if (serviceId === "love") return card.love;
      if (serviceId === "career") return card.career;
      if (serviceId === "angel") return card.general;
      if (serviceId === "yes-no") return card.general;
      if (serviceId === "consultation") return card.general;
      if (serviceId === "three-card") {
        if (positionIndex === 0) return "What has shaped this: " + card.general;
        if (positionIndex === 1) return "Where things stand: " + card.general;
        return "A possible direction from here: " + card.general;
      }
      return card.general;
    }

    function buildSummary(serviceId, drawn) {
      var parts = [];
      var names = drawn.map(function (item) { return item.card.name; });

      if (serviceId === "yes-no") {
        var card = drawn[0].card;
        var lean = card.yesNo.lean;
        var phrase =
          lean === "yes"
            ? "leans towards <strong>yes</strong>"
            : lean === "no"
              ? "leans towards <strong>no</strong>"
              : "does not give a clear <strong>yes or no</strong>";
        parts.push(
          "<p>For your question, <strong>" + UI.escapeHtml(card.name) + "</strong> " + phrase + ". " +
          UI.escapeHtml(card.yesNo.note) + "</p>"
        );
        parts.push(
          "<p>A tarot card cannot make a decision for you, and this is not a prediction. It can, however, " +
          "be a useful mirror: read the position below and notice which part of it you react to most strongly.</p>"
        );
      } else if (serviceId === "angel") {
        parts.push(
          "<p>Your angel card today is <strong>" + UI.escapeHtml(drawn[0].card.name) + "</strong>. " +
          "Angel card reading is used here as a gentle, inspirational prompt for hope and mindfulness — " +
          "a moment of reflection rather than a message with a guaranteed outcome.</p>"
        );
      } else {
        var list = names.map(function (name, index) {
          return "<strong>" + UI.escapeHtml(name) + "</strong> (" + UI.escapeHtml(drawn[index].position) + ")";
        });
        parts.push("<p>Your cards were " + list.join(", ") + ".</p>");

        var themes = [];
        drawn.forEach(function (item) {
          item.card.keywords.forEach(function (keyword) {
            if (themes.indexOf(keyword) === -1) themes.push(keyword);
          });
        });
        parts.push(
          "<p>Read together, the recurring themes are <strong>" +
          UI.escapeHtml(themes.slice(0, 5).join(", ")) +
          "</strong>. Where two cards echo each other, that is usually the part of the reading worth sitting with " +
          "longest.</p>"
        );

        if (serviceId === "consultation") {
          parts.push(
            "<p>This demo spread is a small preview of the themes a one-to-one session explores. A live " +
            "consultation gives space for your full context, follow-up questions and a conversation rather " +
            "than a fixed script.</p>"
          );
        }
      }

      var nextStep =
        serviceId === "love"
          ? "Choose one honest conversation, or one small act of care, to offer this week."
          : serviceId === "career"
            ? "Write down one concrete next action and give it a date."
            : serviceId === "yes-no"
              ? "Sit with the card for a day before deciding, and notice what your first reaction was."
              : serviceId === "angel"
                ? "Carry the affirmation with you and revisit it tonight."
                : "Pick the card you reacted to most strongly and write three lines about why.";

      parts.push("<p><strong>One small next step:</strong> " + UI.escapeHtml(nextStep) + "</p>");

      parts.push(
        '<p class="small dim">Drawn at random from a 12-card sample deck in your browser. This reading is ' +
        "offered for reflection and entertainment, is not a prediction of the future, and is not legal, " +
        "medical, financial or psychological advice.</p>"
      );

      return parts.join("");
    }

    function summaryPlainText(serviceId, drawn) {
      var lines = [];
      var service = window.TAROT_CONFIG.getService(serviceId);
      lines.push((service ? service.name : "Tarot reading") + " — " + formatDate(new Date().toISOString()));
      if (state.question) lines.push('Question: "' + state.question + '"');
      lines.push("");
      drawn.forEach(function (item) {
        lines.push(item.position + ": " + item.card.name);
        lines.push(contextualText(item.card, serviceId, item.positionIndex).replace(/\s+/g, " "));
        lines.push("");
      });
      if (serviceId === "yes-no") {
        lines.push("Tone of the card: " + drawn[0].card.yesNo.lean + " — " + drawn[0].card.yesNo.note);
        lines.push("");
      }
      lines.push("Reflection: " + drawn[0].card.reflection);
      lines.push("Affirmation: " + drawn[0].card.affirmation);
      lines.push("");
      lines.push(
        "Reflective reading for entertainment and personal reflection only. Not a prediction, and not legal, " +
        "medical, financial or psychological advice."
      );
      return lines.join("\n");
    }

    /* ---------------- reveal ---------------- */
    function reveal() {
      var service = window.TAROT_CONFIG.getService(state.serviceId);
      if (!service) return;

      if (state.picks.length !== service.cards) {
        UI.toast("Please choose " + service.cards + (service.cards === 1 ? " card" : " cards") + " first.", "warn");
        return;
      }

      var label = service.name + " (" + service.credits + " credits)";

      if (!window.TarotWallet) {
        UI.toast("The demo wallet did not load, so no credits were deducted.", "error");
        return;
      }

      window.TarotWallet.spend(service.credits, label).then(function (paid) {
        if (!paid) return;

        state.revealed = true;
        var positions = (window.TAROT_CONFIG.spreads[state.serviceId] || ["Your card"]);
        var drawn = state.picks.map(function (id, index) {
          return {
            card: findCard(id),
            position: positions[index] || "Card " + (index + 1),
            positionIndex: index
          };
        });

        var cards = deckEl.querySelectorAll(".deck-card");
        for (var i = 0; i < cards.length; i += 1) {
          var isPicked = state.picks.indexOf(cards[i].getAttribute("data-card-id")) > -1;
          if (!isPicked) {
            cards[i].disabled = true;
            cards[i].setAttribute("tabindex", "-1");
          }
        }

        // Flip the chosen cards in the order they were selected.
        state.picks.forEach(function (id, index) {
          window.setTimeout(function () {
            var el = deckEl.querySelector('.deck-card[data-card-id="' + id + '"]');
            if (el) el.classList.add("is-flipped");
          }, 260 * index + 120);
        });

        var flipTotal = 260 * state.picks.length + 500;

        window.setTimeout(function () {
          if (resultTitle) resultTitle.textContent = service.name + " — your reading";
          if (questionEcho) {
            if (state.question) {
              questionEcho.hidden = false;
              questionEcho.innerHTML =
                '<span class="dim">You focused on:</span> <em>' + UI.escapeHtml(state.question) + "</em>";
            } else {
              questionEcho.hidden = true;
            }
          }

          if (spreadEl) {
            spreadEl.innerHTML = drawn
              .map(function (item) {
                return (
                  '<div class="spread__item">' +
                    '<p class="spread__pos">' + UI.escapeHtml(item.position) + "</p>" +
                    '<div class="tarot-card tarot-card--lg" style="--card-w:100%;max-width:220px;margin-inline:auto;">' +
                      '<img src="' + item.card.art + '" alt="' + UI.escapeHtml(item.card.name) +
                      ' tarot card illustration" width="500" height="840" loading="lazy" decoding="async">' +
                    "</div>" +
                    '<h4 class="spread__name">' + UI.escapeHtml(item.card.name) +
                    ' <span class="dim small">' + UI.escapeHtml(item.card.numeral) + "</span></h4>" +
                    '<p class="spread__keywords">' + UI.escapeHtml(item.card.keywords.join(" · ")) + "</p>" +
                    '<p class="spread__text">' + UI.escapeHtml(contextualText(item.card, state.serviceId, item.positionIndex)) + "</p>" +
                    '<p class="spread__text"><strong class="gold">Reflect:</strong> ' +
                    UI.escapeHtml(item.card.reflection) + "</p>" +
                    '<p class="spread__text"><strong class="gold">Affirmation:</strong> <em>' +
                    UI.escapeHtml(item.card.affirmation) + "</em></p>" +
                  "</div>"
                );
              })
              .join("");
          }

          if (summaryEl) summaryEl.innerHTML = buildSummary(state.serviceId, drawn);

          state.lastReading = {
            serviceId: state.serviceId,
            serviceName: service.name,
            question: state.question,
            credits: service.credits,
            cards: drawn.map(function (item) { return { name: item.card.name, position: item.position }; }),
            text: summaryPlainText(state.serviceId, drawn)
          };

          goToStep("result");
        }, flipTotal);
      });
    }

    /* ---------------- saved readings ---------------- */
    var SAVED_KEY = "djk.demo.readings.v1";

    function readSaved() {
      try {
        var raw = window.localStorage.getItem(SAVED_KEY);
        var parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function writeSaved(list) {
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(0, 12)));
      } catch (error) {
        UI.toast("This browser is not allowing local storage, so the reading could not be saved.", "error");
      }
    }

    function renderSaved() {
      if (!savedList) return;
      var items = readSaved();
      if (!items.length) {
        savedList.innerHTML =
          '<p class="dim small">No saved readings yet. After a reading you can save it here — stored only in ' +
          "this browser.</p>";
        return;
      }
      savedList.innerHTML = items
        .map(function (item, index) {
          return (
            '<div class="saved-reading">' +
              "<div>" +
                '<p class="saved-reading__title">' + UI.escapeHtml(item.serviceName || "Reading") +
                ' <span class="dim small">· ' + item.cards.length + " cards</span></p>" +
                '<p class="saved-reading__meta">' + UI.escapeHtml(formatDate(item.savedAt)) +
                (item.question ? " · “" + UI.escapeHtml(item.question) + "”" : "") + "</p>" +
              "</div>" +
              '<div class="btn-row">' +
                '<button type="button" class="btn btn--ghost btn--sm" data-view-saved="' + index + '">View</button>' +
                '<button type="button" class="btn btn--ghost btn--sm" data-download-saved="' + index + '">Download</button>' +
                '<button type="button" class="btn btn--ghost btn--sm" data-delete-saved="' + index + '" ' +
                  'aria-label="Delete saved reading from ' + UI.escapeHtml(formatDate(item.savedAt)) + '">Delete</button>' +
              "</div>" +
            "</div>"
          );
        })
        .join("");
    }

    function downloadText(filename, text) {
      try {
        var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      } catch (error) {
        UI.toast("Download is not supported in this browser.", "error");
      }
    }

    /* ---------------- events ---------------- */
    app.addEventListener("click", function (event) {
      var choice = event.target.closest("[data-choose-service]");
      if (choice) {
        event.preventDefault();
        if (applyService(choice.getAttribute("data-choose-service"))) goToStep("focus");
        return;
      }

      var back = event.target.closest("[data-back-to-choose]");
      if (back) {
        event.preventDefault();
        goToStep("choose");
        return;
      }

      var toDraw = event.target.closest("[data-focus-continue]");
      if (toDraw) {
        event.preventDefault();
        if (questionField) state.question = questionField.value.trim();
        if (!state.question) {
          UI.toast("Add a short question or focus — even a few words is enough.", "warn");
          if (questionField) questionField.focus();
          return;
        }
        goToStep("draw");
        return;
      }

      var card = event.target.closest(".deck-card");
      if (card && deckEl && deckEl.contains(card)) {
        toggleCard(card);
        return;
      }

      if (event.target.closest("[data-reveal-btn]")) {
        event.preventDefault();
        reveal();
        return;
      }

      if (event.target.closest("[data-restart]")) {
        event.preventDefault();
        state.picks = [];
        state.revealed = false;
        state.lastReading = null;
        if (state.serviceId) {
          applyService(state.serviceId, true);
          goToStep("draw");
        } else {
          goToStep("choose");
        }
        UI.toast("Reading reset. Choose your cards again whenever you like.", "ok");
        return;
      }

      if (event.target.closest("[data-save-reading]")) {
        event.preventDefault();
        if (!state.lastReading) {
          UI.toast("Complete a reading first, then you can save it.", "warn");
          return;
        }
        var list = readSaved();
        list.unshift({
          savedAt: new Date().toISOString(),
          serviceId: state.lastReading.serviceId,
          serviceName: state.lastReading.serviceName,
          question: state.lastReading.question,
          cards: state.lastReading.cards,
          text: state.lastReading.text
        });
        writeSaved(list);
        renderSaved();
        UI.toast("Reading saved in this browser. It is not uploaded anywhere.", "ok");
        return;
      }

      if (event.target.closest("[data-download-reading]")) {
        event.preventDefault();
        if (!state.lastReading) {
          UI.toast("Complete a reading first, then you can download it.", "warn");
          return;
        }
        downloadText("tarot-reading-" + todayKey() + ".txt", state.lastReading.text);
        return;
      }

      var view = event.target.closest("[data-view-saved]");
      if (view) {
        var item = readSaved()[parseInt(view.getAttribute("data-view-saved"), 10)];
        if (item) {
          UI.confirm({
            title: item.serviceName || "Saved reading",
            bodyHtml: "<pre style=\"white-space:pre-wrap;font-family:inherit;font-size:.88rem;color:inherit;margin:0\">" +
              UI.escapeHtml(item.text) + "</pre>",
            confirmLabel: "Download",
            cancelLabel: "Close"
          }).then(function (download) {
            if (download) downloadText("tarot-reading.txt", item.text);
          });
        }
        return;
      }

      var download = event.target.closest("[data-download-saved]");
      if (download) {
        var dItem = readSaved()[parseInt(download.getAttribute("data-download-saved"), 10)];
        if (dItem) downloadText("tarot-reading.txt", dItem.text);
        return;
      }

      var del = event.target.closest("[data-delete-saved]");
      if (del) {
        event.preventDefault();
        var index = parseInt(del.getAttribute("data-delete-saved"), 10);
        var current = readSaved();
        current.splice(index, 1);
        writeSaved(current);
        renderSaved();
        UI.toast("Saved reading removed.", "warn");
      }
    });

    // Keyboard support comes free: the deck cards are real <button> elements.
    renderSaved();

    // Deep link: readings.html?service=love#reading-experience
    var params = new URLSearchParams(window.location.search);
    var requested = params.get("service");
    if (requested && window.TAROT_CONFIG.getService(requested)) {
      applyService(requested, false);
      goToStep("focus");
    } else {
      applyService("three-card", false);
      goToStep("choose");
    }
  }

  /* ================================================================== *
   * 3. DAILY TAROT
   * ================================================================== */
  function initDaily() {
    var app = document.getElementById("daily-app");
    if (!app) return;

    var DAILY_KEY = "djk.demo.daily.v1";

    var cardEl = app.querySelector("[data-daily-card]");
    var nameEl = app.querySelector("[data-daily-name]");
    var numeralEl = app.querySelector("[data-daily-numeral]");
    var keywordsEl = app.querySelector("[data-daily-keywords]");
    var meaningEl = app.querySelector("[data-daily-meaning]");
    var reflectionEl = app.querySelector("[data-daily-reflection]");
    var affirmationEl = app.querySelector("[data-daily-affirmation]");
    var statusEl = app.querySelector("[data-daily-status]");
    var dateEl = app.querySelector("[data-daily-date]");
    var drawBtn = app.querySelector("[data-daily-draw]");
    var resetBtn = app.querySelector("[data-daily-reset]");
    var actionsEl = app.querySelector("[data-daily-actions]");
    var shareBtn = app.querySelector("[data-daily-share]");
    var artImg = app.querySelector("[data-daily-art]");
    var panel = app.querySelector("[data-daily-panel]");

    var current = null;

    function readDaily() {
      try {
        var raw = window.localStorage.getItem(DAILY_KEY);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return parsed && parsed.date === todayKey() ? parsed : null;
      } catch (error) {
        return null;
      }
    }

    function writeDaily(record) {
      try {
        window.localStorage.setItem(DAILY_KEY, JSON.stringify(record));
        return true;
      } catch (error) {
        return false;
      }
    }

    function showCard(card, isFresh) {
      current = card;
      if (artImg) {
        artImg.src = card.art;
        artImg.alt = card.name + " tarot card illustration";
      }
      if (nameEl) nameEl.textContent = card.name;
      if (numeralEl) numeralEl.textContent = "Card " + card.numeral + " · " + card.element;
      if (keywordsEl) keywordsEl.textContent = card.keywords.join(" · ");
      if (meaningEl) meaningEl.textContent = card.general;
      if (reflectionEl) reflectionEl.textContent = card.reflection;
      if (affirmationEl) affirmationEl.textContent = card.affirmation;
      if (actionsEl) actionsEl.hidden = false;
      if (drawBtn) drawBtn.hidden = true;
      if (resetBtn) resetBtn.hidden = false;
      if (panel) panel.hidden = false;
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.className = "form-status form-status--" + (isFresh ? "ok" : "warn");
        statusEl.textContent = isFresh
          ? "Here is today's card. Come back tomorrow for the next one."
          : "You already drew today's card. A new card becomes available tomorrow — or use the demo reset button to try again now.";
      }
      if (cardEl) {
        cardEl.classList.remove("is-flipped");
        window.setTimeout(function () { cardEl.classList.add("is-flipped"); }, isFresh ? 120 : 0);
      }
    }

    function draw() {
      var card = pickRandom(DECK);
      var stored = writeDaily({ date: todayKey(), cardId: card.id });
      if (!stored) {
        if (statusEl) {
          statusEl.hidden = false;
          statusEl.className = "form-status form-status--warn";
          statusEl.textContent =
            "This browser is not allowing local storage, so the daily card cannot be remembered. " +
            "You can still read the card below.";
        }
      }
      showCard(card, true);
    }

    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }

    var existing = readDaily();
    if (existing) {
      var card = findCard(existing.cardId);
      if (card) showCard(card, false);
    }

    if (drawBtn) {
      drawBtn.addEventListener("click", function () { draw(); });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        UI.confirm({
          title: "Draw again today?",
          bodyHtml:
            "<p>This is a demo-only control. In a real deployment the daily limit would be enforced on a " +
            "server; here it is stored in your browser and can be cleared at any time.</p>",
          confirmLabel: "Draw another card",
          cancelLabel: "Keep today's card",
          confirmTone: "danger"
        }).then(function (ok) { if (ok) draw(); });
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        if (!current) return;
        var text =
          "My daily tarot card: " + current.name + " — " + current.keywords.join(", ") + ".\n" +
          "Reflection: " + current.reflection + "\n" +
          "Affirmation: " + current.affirmation;
        if (navigator.share) {
          navigator.share({ title: "Daily tarot card", text: text }).catch(function () { /* dismissed */ });
          return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(
            function () { UI.toast("Reading copied to your clipboard.", "ok"); },
            function () { UI.toast("Copying is not available in this browser.", "error"); }
          );
        } else {
          UI.alert({
            title: "Share your reading",
            bodyHtml: "<p>Copy the text below to share it:</p><pre style=\"white-space:pre-wrap;font-family:inherit;font-size:.85rem\">" +
              UI.escapeHtml(text) + "</pre>"
          });
        }
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * BOOTSTRAP
   * ------------------------------------------------------------------ */
  function init() {
    initReader();
    initDaily();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
