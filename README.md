# Tarot Reading Website — Dr. Jasdeep Kaur

A static, multi-page website for a professional tarot reading practice: luxury celestial design, an
interactive tarot reading flow, a daily card, a demo credit wallet, and consultation booking forms.

Built with plain **HTML5, CSS3 and vanilla JavaScript**. No frameworks, no build step, no
dependencies, no API keys.

---

## 1. Quick start (run it locally)

The simplest way is to open `index.html` in a browser. Everything except the "download a reading"
button works straight from the file system.

For the closest match to a real server, serve the folder over HTTP — pick whichever you have:

```bash
# Node.js (no install needed)
npx serve .

# PHP
php -S localhost:8080

# Python 3
python3 -m http.server 8080
```

Then visit <http://localhost:8080>.

In VS Code you can also right-click `index.html` and choose **Open with Live Server**.

> A server is recommended rather than required. `localStorage`, SVG images and all links work
> fine over `file://`; only the share-sheet button on the Daily Tarot page behaves slightly
> differently (it falls back to copying text).

---

## 2. File structure

```
tarot_jasdeep/
├── index.html                 Home
├── about.html                 About Dr. Jasdeep Kaur
├── readings.html              Services + the interactive reading experience
├── daily-tarot.html           Daily card draw
├── pricing.html               Packages, credits and the demo wallet
├── booking.html               Consultation booking form
├── contact.html               Contact details and message form
├── login.html                 Login (demo)
├── register.html              Register (demo)
├── privacy-policy.html        Legal
├── terms.html                 Legal
├── refund-policy.html         Legal
├── disclaimer.html            Legal
├── css/
│   └── style.css              All styling (design tokens, components, responsive, print)
├── js/
│   ├── main.js                Site config (TAROT_CONFIG), nav, UI helpers, validation, renderers
│   ├── tarot.js               Card data + reading flow + daily card
│   ├── wallet.js              Demo credit wallet
│   └── booking.js             Booking / contact / auth form behaviour
└── assets/
    ├── icons/favicon.svg
    ├── images/                Hero, portrait placeholder, OG placeholder, 6 service illustrations
    └── tarot-cards/           Card back + 12 illustrated cards (SVG)
```

Every page duplicates the same header and footer markup on purpose, so the site is directly
editable as plain HTML — no templating or build step to run.

---

## 3. Editing the site

### Prices, credit costs, durations, contact details

Almost everything configurable lives in one place: **`js/main.js`**, in the `window.TAROT_CONFIG`
object.

```js
window.TAROT_CONFIG = {
  currency: { symbol: "₹", code: "INR" },
  services: { love: { name: "...", cards: 3, credits: 20, duration: "15 min" }, ... },
  spreadPositions: { ... },
  packages: [ { id: "starter", name: "Starter", credits: 50, price: 499, perks: [...] }, ... ],
  contact: { email: "...", phone: "...", whatsapp: "...", hours: "...", location: "..." }
};
```

Change a value here and it updates everywhere it is used:

| You edit | What updates |
| --- | --- |
| `services.*.credits` | Credit badge on every service card, the "Confirm your reading" dialog, the wallet balance after a reading, the service price list on `pricing.html` |
| `services.*.duration` | Duration shown on the service cards |
| `packages[].credits` / `.price` | Package cards on the home page and `pricing.html` |
| `contact.*` | Every contact value across the site, including the footer |

### Placeholder content you must replace before publishing

These are deliberately fake or empty so nothing untrue is published:

- **Contact details** — `hello@example.com`, `+00 00000 00000`. Replace in `js/main.js`.
  Do not publish a phone number, email or WhatsApp link that is not genuinely monitored.
- **Photograph** — `assets/images/portrait-placeholder.svg` is a dashed frame. Replace it with a
  real professional photograph, ideally 720×900 or the same 4:5 ratio, and update the `src` and
  `alt` text in `about.html` and `index.html`.
- **Social links** — the footer social links point to `#` placeholders. Either point them at real
  profiles or remove them.
- **Legal pages** — `privacy-policy.html`, `terms.html`, `refund-policy.html` and
  `disclaimer.html` are clearly marked templates with `[to be completed]` placeholders. They must
  be reviewed by a qualified professional for your jurisdiction before launch.
- **Testimonials** — the home page shows three visibly-labelled placeholder cards. Replace them
  only with feedback you have actually received and have permission to publish. Do not invent
  reviews, ratings or client names.
- **About page** — the "spiritual practice", "tarot experience", "philosophy" and "languages"
  blocks are editable placeholders. Fill in only what is true and verifiable.

### Imagery

All artwork is original inline SVG drawn for this site (gold line art on dark gradients). To swap
in your own images, drop the files into `assets/images/` or `assets/tarot-cards/` and update the
matching `src` attributes. Keep the existing aspect ratios: service images are 640×400, cards are
500×840, the portrait is 720×900, and the social sharing image is 1200×630.

The 12 card illustrations are the Rider–Waite–Smith *subjects* redrawn as original abstract line
art. The traditional card names and divinatory meanings are public domain; the artwork here is not
copied from any existing deck.

---

## 4. The demo wallet and demo data (please read)

The credit wallet, saved readings and the daily card are **demonstrations**. They run entirely in
the browser via `localStorage`:

| Key | Holds |
| --- | --- |
| `djk.demo.wallet.v1` | Credit balance and demo transaction history |
| `djk.demo.readings.v1` | Saved readings |
| `djk.demo.daily.v1` | Today's daily card |
| `djk.demo.bookingDraft.v1` | Unsent booking form draft |

What this means:

- **No payment is processed anywhere on this site.** Buying a package only adds demo credits.
- Credits are **not** a real balance. Anyone can open DevTools and edit them, and they can be
  wiped by clearing browser data or by using a private window.
- There is **no account system**. Login and Register are interface demonstrations only; nothing is
  submitted or stored. In particular, **no password is ever written to `localStorage`** — the auth
  forms validate and then explicitly discard their input.
- Clearing site data resets credits to the starting demo balance of 30.

All of this is stated on the pages themselves, in the wallet panel, in the purchase dialog, and in
the Daily Tarot storage note.

---

## 5. Deploying

The site is fully static — any static host works. There is no build step.

### GitHub Pages

```bash
git init
git add .
git commit -m "Add tarot reading website"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch → Branch: `main`,
folder: `/ (root)`**. The site appears at `https://<you>.github.io/<repo>/`.

### Netlify

- **Drag and drop:** open <https://app.netlify.com/drop> and drop the project folder in.
- **Git:** connect the repository, leave the build command empty and set the publish directory
  to the repository root.

### Cloudflare Pages

Connect the repository in the Cloudflare dashboard, leave the build command empty and set the
build output directory to `/` (the project root).

### Before you deploy

1. Replace every placeholder listed in section 3.
2. Update the canonical URLs and `og:url` values — they currently read
   `https://example.com/page.html`. Each page has its own `<link rel="canonical">` and Open Graph
   tags in the `<head>`.
3. Replace `assets/images/og-image-placeholder.svg` with a real 1200×630 image.
4. Check that the structured data on the home page (`Person` and `WebSite` JSON-LD) still
   describes only facts you can verify, and that the `sameAs` array points at real profiles.

---

## 6. What still needs a backend before this can go live commercially

Everything below is genuinely absent, not merely unfinished — the static pages are honest about it
and none of them pretend these features work.

**Accounts and authentication**
- Real registration, login, logout, session handling and password reset
- Server-side password hashing (Argon2id or bcrypt) and secure, httpOnly session cookies
- Email verification and a transactional email provider
- Rate limiting and abuse protection on the auth endpoints

**Payments and credits**
- A payment provider such as Razorpay or Stripe, subject to availability and eligibility
- Server-created orders and **server-side signature verification** of every payment callback
- Credit balances stored in a database and mutated only by the server
- A webhook endpoint to fulfil orders and reconcile refunds
- Idempotency so a repeated callback cannot double-credit an account
- The reading flow must ask the server to debit credits and receive a signed result — never trust
  the browser's claim that a payment or a balance is valid

**Readings and bookings**
- An endpoint to persist readings against a real account
- Booking submissions delivered by email or written to a CRM/database
- Availability lookup and double-booking prevention
- Automatic confirmation and reminder emails
- Contact and message forms actually delivered

**Content and operations**
- A CMS or admin interface so the owner can edit prices and copy without touching code
- A privacy-respecting analytics setup
- Server-side logging and error monitoring

**Legal and compliance**
- Completed Privacy Policy, Terms, Refund/Cancellation Policy and Disclaimer, reviewed for the
  jurisdictions you serve
- A cookie/consent approach appropriate to your analytics and payment providers
- A documented data retention and deletion process

---

## 7. Accessibility and browser support

- Semantic HTML5 landmarks (`header`, `nav`, `main`, `footer`) and a skip link on every page.
- Keyboard accessible throughout: the mobile menu traps and restores focus, the tarot deck is
  built from real `<button>` elements, the confirm dialogs trap focus and close on `Escape`, and
  the toast region is announced via `aria-live`.
- Forms use real `<label>` elements, `aria-invalid` and `aria-describedby` for error text, and
  every validation message is text, not colour alone.
- `prefers-reduced-motion` disables the star drift, twinkle, flip and reveal animations.
- A print stylesheet strips the background and chrome for clean printing.
- Tested layout breakpoints: 1280px, 1099px, 720px and 420px.

Works in current versions of Chrome, Edge, Firefox and Safari. Uses CSS custom properties,
`aspect-ratio`, `:focus-visible`, `backdrop-filter` and `crypto.getRandomValues` — all widely
supported. Older browsers degrade to a plainer but fully functional layout.

---

## 8. Content integrity notes

These constraints were applied deliberately and should be preserved when you edit:

- Dr. Jasdeep Kaur's **PhD in Law** and 11+ years as a practising advocate are presented as legal
  qualifications only. Every page that mentions them, plus the footer, states plainly that they
  are **not** tarot, astrology or spiritual qualifications.
- No awards, certifications, client counts, years of tarot experience, success rates or
  testimonials have been invented.
- No contact details, response times or availability hours have been invented.
- Readings are consistently described as **spiritual interpretation and personal reflection**, not
  predictions, and not a substitute for legal, medical, financial or psychological advice.
- The Yes/No service gives a nuanced leaning with an explanation rather than a guaranteed answer.
- No claims about supernatural accuracy and no SEO promises about search rankings.

If you add content, keep it to what can be evidenced.

---

## 9. Randomness in the card draw

Card selection uses `crypto.getRandomValues()` with rejection sampling, shuffled with
Fisher–Yates, so the draw is as close to uniformly random as the browser allows rather than
`Math.random()`. This is about fairness of the shuffle, not about anything predictive — the
readings themselves are framed as reflective, not deterministic.

---

## 10. Licence and credits

Site code and original SVG artwork: prepared for Dr. Jasdeep Kaur.

Card names, the 22 Major Arcana sequence and traditional divinatory meanings are public domain.
The 12 illustrations, the card back, the service illustrations and the hero artwork were drawn
specifically for this project and are not derived from any copyrighted deck.

Fonts (Cormorant Garamond and Inter) load from Google Fonts and are used under the SIL Open Font
License. If you need a fully offline or cookie-free build, self-host them and remove the Google
Fonts `<link>` from each page's `<head>`.
