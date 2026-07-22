# CONTEXT — read this first

Orientation + coordination for anyone (human or a Claude thread) working in this repo. This is the
current "state of play" and the rules for working here. `PROJECT.md` is the long history / decisions
log; this file is the map.

---

## What this repo is

**The App Router Guide** — an internal guide teaching server-first Next.js 16 / React 19 patterns
(the app in the content is called "Tracker"). Built with **Astro 6** (static output) + **Tailwind
4** (via `@tailwindcss/vite`) + SCSS.

It ships as several **distributables** under `build/output/` (gitignored):

- `app-router-guide_html/` — the browsable multi-page site (Astro's `outDir`).
- `app-router-guide.html` — one self-contained HTML file.
- `app-router-guide_md/` + `app-router-guide.md` — markdown forms.
- `app-router-guide-deck.html` — the self-contained **slide deck** presentation.

There are also two **dev-only tooling layers** that never ship: a page-notes annotation system and a
slide-deck authoring system (see below).

---

## Repo map

- `src/pages/sections/NN-slug.astro` — the 21 chapters (the content).
- `src/pages/index.astro` — the cover / TOC. `src/pages/deck.astro` — the deck view.
- `src/components/` — `Diagram.astro`, `Snippet.astro`, `Compare*.astro`, `Chip`, `Callout`,
  `GoDeeper`, `CodeCaption`, etc.
- `src/layouts/GuidePage.astro` — the guide page shell (imports styles; dev-gates the annotation
  layer).
- `src/styles/style.scss` + `src/styles/partials/*` — the design system.
  `partials/_draft-tools.scss` and `partials/_deck-view.scss` are the tooling styles.
- `public/assets/nav.js` — sidebar/TOC + search **and** the dev-only notes + deck-authoring UI (in a
  stripped block).
- `public/assets/deck-view.js` — the presentation renderer (dev `/deck` + the distributable).
- `server/` — dev-only API code: `db.mjs` (Prisma singleton + notes), `note-enums.mjs`,
  `notes-middleware.mjs`, `deck-db.mjs`, `deck-enums.mjs`, `deck-middleware.mjs`.
- `prisma/schema.prisma` + `prisma/notes.db` (committed SQLite) + `prisma/seed.mjs`.
- `scripts/` — `build_dist.py` (orchestrator), `build_artifact.py`, `build_md.py`, `build_deck.py`,
  `deck_titles.py`, `build_search_index.py`, `postbuild_relativize.py`, `svg_lint.py`.
- `astro.config.mjs` — Astro config + the dev-only `/api/notes` and `/api/deck` Vite middleware.

---

## Dev vs. build (the core invariant)

- **Dev** (`npm run dev`): the annotation + deck-authoring UI is live, and two dev-only endpoints
  exist — `/api/notes` and `/api/deck` — served by a Vite plugin in `astro.config.mjs`
  (`apply: 'serve'`, lazy-imported). They read/write the committed SQLite DB via Prisma.
- **Build** (`astro build`): 100% static HTML. The dev-only block in `nav.js` and the dev-only SCSS
  are **stripped** by `postbuild_relativize.py`; the Vite middleware never applies; Prisma/DB never
  ship. If you add tooling, keep it inside the dev-only paths so it strips.
- Sanity checks after any nav.js/SCSS change: `npm run build` must exit 0 and print "draft layer
  stripped", and `grep` the built `nav.js` to confirm your new tooling strings (e.g. `api/deck`) are
  **absent** from the shipped file.

---

## The two tooling systems (both dev-only, DB-backed)

**Page notes** — annotate any block in the guide; notes persist to the DB immediately
(`/api/notes`). `Note` model; `surface` = `doc`. Claude resolves a note by setting
`status='resolved'` + a `resolution` string in the DB.

**Slide deck** — designate doc blocks (diagrams/snippets, addressed by a stable `data-content-id` =
`"<page>::<type>::<n>"`) into `Slide`s (which hold ordered `SlideItem`s). The DB stores only
references + arrangement + notes; **content is always pulled live from the document** at view/build
time (never copied into the DB). Slide titles are **stored** in `Slide.title` (never derived at
render); `autoTitle` marks a title as Claude-managed. Deck notes use `Note.surface='deck'`;
inclusion notes are `Note`s linked via `slideId`/`slideItemId`.

Enums (`status`, `kind`, `surface`, `layout`) are **not** Prisma enums (SQLite can't) — they're
plain string columns whose allowed values live in `server/note-enums.mjs` / `server/deck-enums.mjs`
and are validated on every write.

---

## Database

- Committed SQLite at `prisma/notes.db`. Schema in `prisma/schema.prisma`.
- First-time / after schema changes: `npm run db:push` (adds tables/columns, preserves data).
  `npm run db:seed` imports `public/page-notes.json`.
- **Claude edits the DB with Python's stdlib `sqlite3`** (no Prisma needed in the sandbox) — e.g.
  resolve notes, set deck titles. The app uses Prisma at runtime.
- `npm run deck:titles [-- --apply]` fills empty auto-title slides from the first block's nearest
  heading; Claude refines titles by writing to the DB.

---

## Build / verify gate (run before every commit)

1. `npm run build` → exit 0, dev layer stripped.
2. `python3 scripts/svg_lint.py` → `CLEAN.` (diagram geometry rules; see PROJECT.md).
3. Every `<Diagram>` must keep its Mermaid twin in sync (`<pre slot="mermaid">`); `build_md.py`
   warns on a missing twin.
4. Broken-link / compare-budget / em-dash checks as applicable.
5. `npm run dist` regenerates all distributables (incl. the deck).

Commits are authored **as Nick**:
`git -c user.name="Nick Florin" -c user.email="nick.florin@crafteducation.com" commit`.

---

## Conventions (quick reference)

- Diagram colors: `fill-dg-*` / `stroke-dg-*` Tailwind utilities backed by `@theme` tokens in
  `src/styles/tailwind.css`; `svg_lint` resolves them to hex.
- Scaled icons in SVG use `<g transform=...>`, never a nested `<svg>` (breaks lint).
- Snippet encoding: `tok-*` spans, `&lt;`/`&gt;`/`&amp;`, filenames in `<span class="filename">`.
- `page-notes.json` is gitignored (the DB is the source of truth now); don't delete it until every
  resolved note it holds is confirmed in the DB.
- Prefer prose over bullet-heavy formatting in the guide's own content.

---

## Parallel work: disjoint lanes (the coordination rule)

Every Cowork thread edits the **same working folder on disk**, so two threads touching the same file
at once corrupt each other. The rule: **each active thread stays inside one lane, and never edits
another lane's files or a shared hotspot while another thread is active.** Scope each task to a
single lane.

**Lanes (disjoint file sets):**

| Lane          | Owns (edit freely)                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content A** | `src/pages/sections/01…10-*.astro`                                                                                                                                  |
| **Content B** | `src/pages/sections/11…21-*.astro`, `src/pages/index.astro`                                                                                                         |
| **Deck**      | `src/pages/deck.astro`, `public/assets/deck-view.js`, `src/styles/partials/_deck-view.scss`, `server/deck-*.mjs`, `scripts/build_deck.py`, `scripts/deck_titles.py` |
| **Notes**     | `server/db.mjs`, `server/note-enums.mjs`, `server/notes-middleware.mjs`                                                                                             |
| **Infra**     | `scripts/build_*.py` (except build_deck), `build_search_index.py`, `postbuild_relativize.py`, `svg_lint.py`                                                         |

**Shared hotspots — one owner at a time, announce before touching:** `public/assets/nav.js` (holds
BOTH the notes and deck-authoring UI), `prisma/schema.prisma`, `package.json`, `astro.config.mjs`,
`src/styles/style.scss`, `src/styles/partials/_draft-tools.scss`, `src/components/Diagram.astro` /
`Snippet.astro`, `prisma/notes.db`.

**Protocol:**

- State your lane at the start of a thread; keep the whole task within it.
- Commit small and often (each commit passes the gate) so other lanes can pull cleanly.
- Never run two threads in the same lane, and never edit a shared hotspot from two threads at once.
  If a task needs a hotspot, it should be the only active thread, or split so the hotspot edit is
  isolated.
- Content lanes (A/B) are the safest to parallelize; they rarely touch anything outside `sections/`.
  Tooling lanes (Deck/Notes/Infra) share `nav.js` and `schema.prisma`, so parallelize those against
  Content lanes, not against each other.

---

## Status (update as things change)

- Guide: 21 chapters, complete and building clean.
- Notes system: done (create-on-type → DB, doc-wide panel, cross-page jump, cancel/click-out).
- Deck system: Phase 1–3 built (models, `/api/deck`, deck mode + panel, `/deck` presentation,
  distributable, deck-surface + inclusion notes, stored/auto titles). **Needs `npm run db:push`** on
  the dev machine to create the `Slide`/`SlideItem` tables before use.
