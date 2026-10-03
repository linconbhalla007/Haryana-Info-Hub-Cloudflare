# Haryana Info Hub

A static, information-only React website for Haryana Government updates —
government orders, jobs/recruitment, schemes, departments, and news. No
backend, no database, no authentication. Built with React + Vite +
React Router, deployable as plain static files to any shared host
(GoDaddy, Hostinger, IONOS, etc.).

> **Demo content notice:** all government orders, jobs, schemes, and news
> items in this project are fictional placeholder content for
> demonstration purposes. Do not present them as real Haryana Government
> notifications — replace with verified, sourced content before launch.

---

## 1. Getting started

```bash
npm install
npm run dev
```

This starts a local dev server (usually at `http://localhost:5173`).

Build for production:

```bash
npm run build
```

This produces a `dist/` folder. Upload the **contents** of `dist/` to your
web host's public directory (e.g. `public_html/`). No Node.js server is
required on the host — it's plain static HTML/CSS/JS.

Preview the production build locally before deploying:

```bash
npm run preview
```

> **Note on this environment:** this project was generated in a sandboxed
> environment without internet access, so `npm install` / `npm run dev` /
> `npm run build` could not be executed here to verify them end-to-end.
> The code follows standard, current Vite + React + React Router
> conventions and should install and build cleanly on your machine — but
> please run the three commands above yourself as a first step and let me
> know if anything needs adjusting.

---

## 2. Adding your real logo

The header currently shows a **placeholder** logo (a simple wordmark), not
your actual Haryana Info Hub logo — no logo file was available when this
project was generated.

To add your real logo:

1. Save your logo file as `public/logo/haryana-info-hub-logo.svg`
   (replacing the placeholder), **or** any filename/format you like (PNG,
   SVG, WebP).
2. If you used a different filename, update `logoPath` in
   `src/config/siteConfig.js` to point at it.

The logo automatically appears in the header (and footer, in white). It's
rendered with `object-fit: contain`, so it won't be stretched.

A matching favicon placeholder is at `public/logo/favicon.svg` — replace
it the same way, or point `index.html`'s `<link rel="icon">` at a new file.

---

## 3. Adding your real hero banner photo

The homepage banner currently uses a designed navy/green gradient
background (no photo was supplied). To use a real photo instead, just
add a file at:

```
public/banners/main-banner.jpg
```

No code changes needed — the banner automatically picks it up. If you use
a different filename, update `bannerImagePath` in
`src/config/siteConfig.js`.

---

## 4. Adding a new government order (with PDF)

1. Copy the PDF file into:
   ```
   public/pdfs/govt-orders/
   ```
2. Add a matching entry to `src/data/governmentOrders.js`:
   ```js
   {
     id: "order-007",
     title: "आपका आदेश शीर्षक",
     date: "20 August 2026",
     department: "Education Department",
     departmentHindi: "शिक्षा विभाग",
     description: "संक्षिप्त विवरण...",
     orderNumber: "HR/EDU/2026/119",
     pdf: "/pdfs/govt-orders/order-007.pdf"
   }
   ```
3. Run `npm run build` (or just refresh `npm run dev`) — it appears
   automatically on `/government-orders` and gets its own detail page at
   `/government-orders/order-007`.

## 5. Adding a new job / recruitment notification

Same pattern: PDF goes in `public/pdfs/jobs/`, and a new object goes in
`src/data/jobs.js`.

## 6. Adding a new scheme, news item, or department

Edit the matching file in `src/data/`:

- `src/data/schemes.js`
- `src/data/news.js`
- `src/data/departments.js`

Each file exports a plain JavaScript array — just add a new object
following the same shape as the existing entries. Every `id` must be
unique within its file (used to build the URL, e.g. `/schemes/scheme-007`).

---

## 7. Updating contact information

Everything in the footer and site metadata (name, email, phone, address,
"Developed by" credit) lives in one file:

```
src/config/siteConfig.js
```

Edit the values there — nothing else needs to change.

---

## 8. Project structure

```
public/
  logo/            → logo + favicon
  banners/         → hero banner photo
  pdfs/
    govt-orders/   → government order PDFs
    jobs/          → recruitment notification PDFs

src/
  components/      → reusable UI (Header, Footer, cards, PDFViewer, ...)
  pages/           → one file per route
  data/            → local content (govt orders, jobs, news, schemes, departments)
  services/        → thin data-access layer — swap for real API calls later
  config/
    siteConfig.js  → site name, contact info, logo/banner paths
```

### Moving to a real backend later

Each file in `src/services/` currently just returns the matching array
from `src/data/`. When you have a real backend, replace the body of each
function with a `fetch()` call to your API — the pages that use these
services don't need to change:

```js
// src/services/governmentOrderService.js — before
export function getAllGovernmentOrders() {
  return Promise.resolve(governmentOrders);
}

// after
export function getAllGovernmentOrders() {
  return fetch('/api/government-orders').then((res) => res.json());
}
```

---

## 9. Routes

```
/
/news
/government-orders
/government-orders/:id
/jobs
/jobs/:id
/schemes
/schemes/:id
/departments
/departments/:id
/search            (also accepts ?q=keyword)
* (any unknown URL) → 404 page
```

---

## 10. Tech stack

- React 18
- Vite 5
- React Router 6
- Plain CSS (CSS variables for theming, no CSS framework)
- No backend, no database, no auth, no external API calls

---

## 11. Deployment checklist

- [ ] Replace placeholder logo (`public/logo/`)
- [ ] Add real banner photo (`public/banners/main-banner.jpg`)
- [ ] Replace demo content in `src/data/` with verified real content
- [ ] Add real PDFs to `public/pdfs/govt-orders/` and `public/pdfs/jobs/`
- [ ] Update contact info in `src/config/siteConfig.js`
- [ ] Run `npm run build`
- [ ] Upload the contents of `dist/` to your hosting provider
