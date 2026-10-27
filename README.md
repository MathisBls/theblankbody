# Blank Body — showcase & e-book shop

One-page showcase with real-time 3D books, plus one product page per book (`/books/<slug>`).
Checkout and downloads happen on Beacons (https://beacons.ai/theblankbody).

Stack: Vite + React + TypeScript, Three.js (React Three Fiber + drei), GSAP + ScrollTrigger, wouter.

## Run locally

Requirements: Node.js 20+ (tested with Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:5173. `npm run dev` first runs `npm run media`, which converts the raw images
from `content/` into compressed WebP files in `public/media/` (only changed images are regenerated).

Production build and local preview:

```bash
npm run build
npm run preview
```

The static site is written to `dist/`.

## Add a book (no code change)

1. Create `content/books/<slug>/` with `front.png` (1600×2400), `back.png` (1600×2400) and `spine.png`
   (180×2400). `../reference/generateur-couvertures.py` generates them.
2. Add one entry to `content/catalog.json` (same fields as the existing ones):
   - `series`: `Sleep`, `Energy` or `Posture` (sets the glow colour and the filter chip),
   - `status`: `available` or `coming-soon`,
   - `price`: `Free`, a price such as `$9` (shows "Buy now · $9"), or anything for coming-soon books,
   - `url`: the Beacons product link (`null` falls back to the Beacons home page).
3. `npm run dev` / `npm run build`: the book appears on the shelf, in the filters and gets its own
   product page at `/books/<slug>`.

## Static files at the site root

Anything placed in `public/` is copied as is to the root of the site. For example, a TikTok
verification file `public/tiktokXXXX.txt` is served at `https://<your-domain>/tiktokXXXX.txt`.
Static files take precedence over the SPA routing on Vercel and Netlify.

## Legal pages

`/terms` and `/privacy` are built from `src/pages/LegalPage/legalDocuments.ts` (structure) and the
`legal.*`, `terms.*` and `privacy.*` keys of `src/i18n/en.ts` (text). Update `legal.updatedOn` when
the content changes.

## Deploy

The site is fully static. SPA routing for `/books/<slug>` is already configured for both hosts.

**Vercel** (`vercel.json` included): import the repository in Vercel, framework "Vite", build command
`npm run build`, output `dist`. Or from the CLI:

```bash
npx vercel --prod
```

**Netlify** (`netlify.toml` and `public/_redirects` included): "Add new site → Import from Git", the
settings are read from `netlify.toml`. Or from the CLI:

```bash
npx netlify deploy --build --prod
```

## Project layout

| Path | Role |
|---|---|
| `content/` | source content: `catalog.json`, book images, brand assets |
| `scripts/build-media.mjs` | image optimisation (sharp → WebP) into `public/media/` |
| `src/data/catalog.ts` | typed catalogue built from `content/catalog.json` |
| `src/three/BookMesh.tsx` | the 3D book (covers, spine, page block, hinged cover, glow) |
| `src/components/CssBook/` | CSS 3D fallback when WebGL is unavailable |
| `src/components/BookOffer/` | price sticker, CTA and reassurance shared by panel and product page |
| `src/sections/` | home page sections (Header, Hero, Bookshelf, HowItWorks, AboutBlank, FreeGuide, Footer) |
| `src/pages/` | home page and product page |
| `src/i18n/en.ts` | every user-facing string |
| `src/styles/tokens.css` | brand colours, fonts, outlines, spacing, motion |

## Accessibility and motion

- Every book is keyboard-focusable (Tab, then Enter opens it, Escape closes it).
- `prefers-reduced-motion`: 3D is replaced by static covers and animations by simple fades.
- No WebGL: books are rendered in CSS 3D from the same images.
