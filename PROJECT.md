# App Router Guide — Project Tracker

**Owner:** Nick (nick.florin@crafteducation.com) · **Started:** 2026-07-13 **Purpose:** Improve the
team's understanding of the Next.js App Router, React 19 best practices, SSR patterns, and the
direction React/Vercel are heading. Nick presents to the team in ~2 weeks.

## Artifacts (in order)

1. **HTML guide** (`html-guide/` — index.html + sections/\*.html, shared styles in assets/) — the
   canonical document. Styled, browser-renderable, native SVG/HTML diagrams. **We iterate on this
   alone until Nick explicitly says to start deriving other artifacts.**
2. Markdown document — generated later from (1), must be 1-1 with it. SVG diagrams convert to
   mermaid.
3. PDF — generated later from (1).
4. HTML slide deck — summarized (less detailed) version for the team presentation.

## ASTRO MIGRATION (2026-07-17, per Nick: Astro 6 + Tailwind 4 hybrid; Phase 1 in progress)

- **Source of truth is moving to `src/`** (Astro pages/components/layouts). `html-guide/` becomes
  BUILD OUTPUT (`npm run build`, outDir html-guide, build.format 'file' so URLs/filenames are
  unchanged; compressHTML off). Until the first successful build verifies parity, the committed
  html-guide pages remain canonical; after that, NEVER hand-edit html-guide.
- Components: Chip (k=react|next|critical|very|imp), Callout (kind,title), GoDeeper, Diagram
  (default slot = svg, named slot caption), Compare + CompareCol (kind,label). Layout:
  GuidePage.astro (title, root='.'|'..', cover). Chrome (sidebar/pager/code-wrap/DRAFT/annotations)
  still runtime via public/assets/nav.js in Phase 1.
- Static assets live in `public/assets/` (style.css, nav.js, logomark.svg) → copied into
  html-guide/assets at build.
- **.astro authoring gotchas:** braces in text are Astro expressions → literal { } in prose/inline
  code must be &#123;/&#125;; pre.code blocks carry `is:raw` (converter added them; keep the
  attribute on new code blocks). Prettier needs prettier-plugin-astro configured (add `plugins:
  ['prettier-plugin-astro']` to .prettierrc.yaml AFTER npm install).
- scripts/migrate_to_astro.py = the one-time converter (re-runnable, reads html-guide → writes
  src/pages). scripts/verify_build.py = post-build parity diff vs git ref.
- **Workflow after parity: edit src/, `npm run build`, then run svg_lint + verification against the
  built html-guide** (the linter parses figure.diagram, which only exists post-build). Artifact
  bundler still reads html-guide → unchanged.
- **PHASE 1 COMPLETE (2026-07-17): build verified, `PARITY OK` against pre-migration pages.**
  SOURCE OF TRUTH IS NOW `src/` - never hand-edit html-guide/ (astro build clears and
  regenerates it; it stays git-tracked as the distributable). Edit loop: edit src/ → astro
  build → svg_lint + checks against built html-guide → build_artifact.py when pushing.
  pnpm supportedArchitectures(darwin+linux/arm64) keeps node_modules usable from the sandbox.
  html-guide/ is prettierignored. PHASE 2
  (Tailwind hybrid): import src/styles/tailwind.css, map palette to theme tokens, convert
  design-system classes via @apply, utilities for layout; component-by-component with Nick
  reviewing visually.

## Repo structure (reorganized 2026-07-16 — per Nick, so future distributables aren't crammed together)

- `html-guide/` — THE canonical document: index.html + sections/\*.html + assets/ (style.css,
  nav.js, logomark.svg). All authoring happens here.
- `markdown-guide/` — placeholder (index.md) for the future 1-1 Markdown derivation. Do not author
  here until Nick green-lights artifact 2.
- `supplementary/` — working-notes.md (Nick's running to-do/content queue with the [ ]/[N]/[x]
  legend; formerly nick-notes.md), audit.md (recraft codebase audit), references.md (external
  sources ledger).
- `scripts/` — svg_lint.py (defaults to html-guide/sections/, resolves from repo root) +
  build_artifact.py (reads html-guide/, writes build/artifact.html).
- `build/` — generated output only. `node_modules/`, package.json (prettier), .prettierrc.yaml,
  .vscode at root.
- Internal relative paths inside html-guide (../assets/…) were unaffected by the move; scripts were
  repointed. Future slide deck gets its own top-level folder (e.g. `slide-deck/`).

## Decisions log

- 2026-07-13: Folder-with-index structure (not single file).
- 2026-07-13: Examples = both generic in main flow + "applied to recraft" material using real
  before/after from the audit.
- 2026-07-13: Content sourced from knowledge + verified with fresh web research (Next 16 / React 19
  features post-date knowledge cutoff).
- External references tracked in `supplementary/references.md` as we go; rendered at the bottom of
  the documents.
- 2026-07-13: Nick provided raw content notes (`supplementary/nick-notes.md`) — the guide's outline
  derives from them. Core thesis: known vs. unknown at first render; maximize the known (SSR);
  containers reserve space; push interactivity to leaves; minimize wires (props/callbacks); use the
  URL more; "Signs You're Doing It Wrong" is a first-class section.
- 2026-07-13: ~~Authority spectrum (framework/strong rec/rec)~~ REPLACED by Nick's request with an
  **importance metric**: **Critical** / **Very important** / **Important** (chips: chip-critical
  red, chip-very amber, chip-imp blue). Mapping applied: framework behavior & strong recs →
  Critical; plain recommendations → Very important. Nothing discussed so far rates below Very
  important; "Important" reserved for future lower-stakes habits. Practices still name their
  legitimate exceptions.
- 2026-07-13: Diagrams styled after Next.js docs (their palette, clean geometric style). Running
  worked example: page header + data table (parallel routes, containers in layout, suspense
  placement, deferred values, flex-grow scroll, deduped queries).

- 2026-07-17: **Inserted new chapter §7 "Bundle Size & Code Splitting" (Part A), per Nick.** Full
  restructuring-rule pass: old §7-18 shifted to §8-19; files renamed 07-18 -> 08-19; new
  07-bundle-size-code-splitting.html authored (wholesale-component trap + composed-table diagram,
  heavyweight imports/ojl-tracker lazy tables/light fallbacks, barrel files, cost-of-bloat table).
  nav.js, index.html, kickers, in-page N.M headings, and every cross-ref updated; verified
  (svg_lint, link targets, §-invariant, HTML balance). The 12 old-named section files were moved to
  `_to_delete/renumbered-old-sections/` (device_commit cannot delete) for Nick to remove.
- 2026-07-17: §1 Introduction expanded (new "What this is, and why I wrote it" section: 90/10
  framing, 2021 origin, use-client-as-type-coercion mindset callout, cannot-cover-everything caveat;
  "Read the docs" deepened with React-vs-Next docs; server-first point folded into the stakes
  alert).

- 2026-07-17 (content pass 2026-07-17b): worked the working-notes [N] queue. §7 gained a
  browser-frame layout diagram (wholesale vs composed table). §1 expanded ("What this is, and why I
  wrote it" + deeper "Read the docs"). §13 Dedupe & Caching gained §13.5 how-Next-extends-fetch,
  §13.6 SWR-in-depth, §13.7 when-client-fetching-is-right. §9.3 gained a reserving-space
  before/after diagram. §10 gained a "Suspense is not server-only" callout. §11.4 gained a
  client-waterfall timeline diagram. §18 gained an expanded useTransition entry and new §18.6
  "Server actions and the HTTP middleman" (typed-RPC explainer + direct-vs-proxy diagram +
  fewer-middlemen principle). All [N] items in working-notes are now [x].
- 2026-07-17 INCIDENT + RECOVERY: the device staging (read) channel returned stale cached copies
  during the big renumber, so §1 and §16-§19 were shuffled in as their old stubs while the real
  content was moved to _to_delete/renumbered-old-sections/. Recovered all five by re-transforming
  the _to_delete originals / re-applying edits, working through the direct-disk (device_bash)
  channel, which is reliable. Lesson: do not trust device_stage_files reads this session; read and
  write via direct disk. The full guide re-verified (203 §-links, invariant, svg_lint, HTML).

- 2026-07-17 (correction): the server-actions/HTTP-middleman and transitions deep dives were briefly
  added to §18 New Primitives, then MOVED per Nick: §18 is a reference catalog only. The in-depth
  discussions now live in the core: §5.10 "Server actions and the HTTP middleman" (diagram included)
  and §10.7 "Transitions keep the old UI alive"; §18 entries link out to them.

## Approved document outline (2026-07-13)

Taxonomy decision: **Known/Unknown thesis** — separate what can be known at first render from what
cannot; three meta-goals: (A) Maximize the Known, (B) Contain the Unknown, (C) Decouple the Parts.
Goals section lists ends only; later chapters elaborate each goal with its techniques (one primary
home per technique + cross-references).

- §1 Introduction — Nick's voice (don't fight the framework; stakes; world-of-pain warning;
  "server-first is not optional" alert); **"The direction of travel" moved here from §3 (2026-07-16)
  and elaborated with a two-era vertical timeline diagram** (client era 2013–2018: React OSS, SPA
  toolchain, Next 1.0, Suspense · server era 2020–2025: RSC RFC, React 18, Next 13/13.4, React 19,
  Next 16 + Compiler 1.0); chip legend
- §2 The Goals — thesis + A/B/C meta-goals, chipped sub-goals, links to chapters. High-level only.
- §3 The Mental Model — bridge back to §1#direction + one-sentence-version callout; 3.1 The new
  rendering model (server-first, RSC payload, hydration, file-based routing, "app dir is your app's
  scaffold, not routes"); 3.2 Why the old mental model bites later. (Old 3.1 moved to §1 on
  2026-07-16; anchors #rendering-model/#old-vs-new unchanged, #direction now lives in
  01-introduction.html.)
- Part A — Maximize the Known: §4 Server-Side Rendering (added 2026-07-15: what SSR is; benefits
  incl. stability + simplicity/nested-spinner problem; perceived performance & streaming; cached
  page output; server vs client routing + RSC payload) · §5 Client/server boundaries (interactivity
  to leaves, "use client", wrapping 3rd party, children pattern) · §6 First-render JS (dynamic
  imports) · §7 Bundle Size & Code Splitting (wholesale-component/MUI-datagrid trap; heavyweight
  imports + light fallbacks; barrel files; cost of bloat; NEW dedicated chapter 2026-07-17) · §8
  Server-resolvable state (URL, params, cookies; tabs-in-state smell)
- Part B — Contain the Unknown: §9 Containers & content shifting (containers known/reserve space;
  loading belongs to boundaries) · §10 Suspense & streaming (triggers, placement diagram,
  loading/error files, useDeferredValue + table problem) · §11 Blocking requests (parallel fetching,
  minimize fetch deps, parallel routes + default.tsx)
- Part C — Decouple the Parts: §12 Minimize the wires · §13 Dedupe & caching (fetch dedupe, React
  cache, "use cache"/cacheComponents, SWR) · §14 Component breakdown (one per file, portability)
- Part D — Applied: §15 Worked example (page header + data table) · §16 Signs You're Doing It Wrong
  (checklist, links back) · §17 Applied to recraft (before/after from audit)
- §18 New Primitives (lower priority; details of Server Actions, form hooks, ViewTransition,
  Activity, useEffectEvent, compiler)
- §19 References

## Working agreements (remember across sessions)

- **"Ready" items in working-notes are `[N]` markers (per Nick, 2026-07-17).** In
  `supplementary/working-notes.md`, `[ ]` is an untouched to-do, `[x]` is done, and `[N]` means
  "address now." When Nick asks to address the "ready" items (or the `[N]` items), scan the whole
  document for every `[N]`, do those tasks, and flip each `[N]` to `[x]` once addressed. A "ready"
  request never touches plain `[ ]` items unless Nick names them. The legend also lives in the
  working-notes.md header.
- **Page annotation workflow (built 2026-07-17).** nav.js ships a draft annotation layer: "+ Add
  note" in the top-right toolbar arms note mode; clicking any block (paragraph, diagram figure,
  code, table, callout, li, heading) opens a dialog; notes render as numbered amber gutter pins
  with a "Notes (n)" panel (jump/edit/resolve/delete). Storage: localStorage key `arg-notes-v1`;
  "Save to file" writes `supplementary/page-notes.json` (File System Access API, download
  fallback); "Load file" imports it back. THE CONTRACT: when Nick says "address my page notes" (or
  similar), read `supplementary/page-notes.json`, act on every note with status "open", then set
  its status to "resolved" and add a short `resolution` field describing what was done; Nick
  re-imports the file in the browser to clear the pins. Notes locate their target via
  content-inner child-index `path` with a text `snippet` fallback and a nearest-heading `anchor`
  for human context. The whole module (bottom of nav.js) + .draft-tools/.note-* CSS is removed
  when the guide ships.
- **NO EM DASHES, ever (per Nick, 2026-07-16).** The document must contain zero U+2014 characters.
  Use commas, colons, semicolons, parentheses, or split the sentence; plain hyphens are allowed
  where a compound or short-label separator reads naturally. En dashes (U+2013) for numeric ranges
  (2013–2020) are fine. Part labels use a colon ("Part A: Maximize the Known"). Verify with a grep
  for U+2014 before finishing any writing task.

- **Miro screenshots from Nick are rough idea sketches only.** He may paste screenshots of diagrams
  he's making in Miro solely to communicate the general idea — they are sloppy, loosely worded, and
  not detailed by his own description. Do NOT reproduce them literally. Take full design liberties:
  extract the concept, then design the real diagram properly (Next.js-docs style, polished labels,
  accurate terminology). They communicate to Claude, not to the doc's reader.
- **Every client-component code example carries an explicit `"use client"` directive** (even
  fragments/snippets), so the boundary is always visible. Server examples show
  `"use server"`/`server-only` where relevant. Scan pattern: client hooks/handlers present but no
  directive → fix.
- **Code examples show the full component lifecycle (per Nick, 2026-07-15):** handlers are written
  INLINE on the actual rendered component (`<Button onClick={() => …}>` inside the returned JSX) —
  never detached named functions like `handleClick`/`onClick()` passed by reference.
  Dialogs/floating elements in examples are loaded with `next/dynamic` and rendered conditionally
  (`{open && <ConfirmDialog …/>}`) so the chunk loads on demand.
- **Code-comment style in all examples:** written like sentences (proper capitalization,
  punctuation); always placed ABOVE the code they reference, never trailing/inline; multi-line
  comments always use `/* ... */` (JSX: `{/* ... */}`). Nick's ojl-tracker (old craft repo) has
  reference examples if ever cloned.
- **Client components reading useSearchParams always ship with their own baked-in Suspense
  boundary** (§5.6 pattern) — the exported component wraps its inner reader.
- **Tables:** cells always wrap (no nowrap columns — page must never scroll horizontally); every
  table row bolds its key 4-5 word phrase (e.g. "never define their own loading states").
- **Diagram palette (per Nick, no purple):** blue = server/known, sky = client/interactive,
  AMBER/warning = unknown/suspended/waiting (also fetches, origin), green = good/content, red = bad.
  Part B branding (goal-B letter, TOC) is amber to match. Purple is banned from diagrams; code-token
  violet (tok-prop) is allowed.
- **2026-07-14: Craft-brand color pass was applied and then FULLY REVERTED at Nick's request — the
  guide keeps its original Next.js-docs-themed palette. Do not re-apply brand colors.** (For the
  record, the Craft design system palette lives in the Claude Design export zip on Nick's Desktop
  and in `recraft/packages/ui/src/styles/*.css`: primary #0070F0, navy #002855, sky #46B1EF, lime
  #97E152, status colors — available if ever wanted for other artifacts like the slide deck.)
- The guide folder is now a git repo; commit before risky styling experiments so reverts are one
  command.
- **Diagram layout rules:** consistent small inner margins on all edges (trim empty viewBox space;
  figure padding is 14px); text never overlaps boxes/edges — wrap the label or widen the box;
  neutral bottom-of-SVG explainer texts are forbidden — that content belongs in the figcaption
  (per-panel colored verdict lines and axis/timeline labels may stay in the SVG).
- **Diagram geometry rules (per Nick):** arrows are straight (horizontal, vertical, or clean
  mirrored diagonals), consistently curved, or segmented straight lines — never wobbly S-curves;
  labels must never overlap arrows (offset ≥10px, use text-anchor start/end away from the line);
  left/right halves of a panel mirror each other; multi-line annotations vertically centered against
  the box they describe; boxes in the same row/column share exact coordinates.
- **RESTRUCTURING RULE (per Nick, permanent): whenever sections are added, removed, or reordered,
  EVERYTHING must be updated in the same pass** — file names, index.html TOC, nav.js TOC array,
  chapter kickers, in-page heading numbers (N.M), every §N/§N.M reference in
  prose/captions/code-comments across ALL files, PROJECT.md outline, and the anchor map. Then
  verify: link-target check (every internal href resolves), § straggler scan, svg_lint, HTML
  validity.
- **Section references are always links.** Every §N / §N.M mention in prose (including figcaptions)
  links to its file + subsection anchor; same-page subsection refs use #anchor. Not linked: refs
  inside code blocks, SVG texts, or headings. Subsection anchor map lives in the cross-linking
  script in session history; when writing new sections, author refs as links directly.
- **Diagram type conventions:** bold = font-weight 500 (never 600), titles 12/11.5px; pointer
  annotations use drawn <line> arrows with markers — glyph arrows (⟵ ↓ →) are banned in small
  annotation text.
- **A marker's color must match its line's stroke** — markers don't inherit stroke, so each arrow
  color needs its own marker def (linter check C1 enforces).
- **Arrowheads are carets, never filled triangles.** Canonical marker:
  `<marker id="X" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 2.5 1.5 L 8 5 L 2.5 8.5" fill="none" stroke="COLOR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker>`.
- **ViewBox is flush to content** (~2px guard each side) — the figure's 14px CSS padding is the only
  padding; linter V1 enforces. Normalization script pattern in session history.
- **Code line-length budgets:** ≤54 chars in compare columns, ≤110 in full-width blocks (verify with
  the measuring script pattern in session history). nav.js provides IDE-style soft-wrap (VS Code
  "same" + comment-text alignment) as a safety net only — authored lines should never wrap at normal
  widths.
- **The guide should be diagram-heavy.** Detailed text too, but prefer a diagram wherever one can
  carry the idea. Native SVG in the HTML doc (→ mermaid later in the Markdown derivation).
- Style/voice/visual template approved by Nick 2026-07-13 based on §1–§3.
- **Every section must reference BOTH the Next.js docs AND the React 19 docs** (react.dev) in its
  "where to go deeper" links — not just Next.js. Log all in references.md.
- Loading-state doctrine (Nick, for §10 and everywhere relevant): components never define their own
  loading states; skeletons per server/client component (never page-level), never shown on refetch;
  SWR pattern = never replace existing content while revalidating, only indicate alongside stale
  content; `isLoading` is applied independently of data presence (no if-loading-else-if-data
  chains); empty state shown iff request finished AND returned no data; data layer must NOT default
  undefined → [] because it destroys the unknown-vs-known-empty distinction. His old `craft` repo
  (ojl-tracker, craft-ui workspaces) has his reference DataTable/loading-indicator patterns — not
  currently cloned; mine it if he provides it.

## Artifact publishing workflow (2026-07-16)

- The guide is published as Claude artifact **`app-router-guide-draft`** for early reviewers. The
  LOCAL FOLDER REMAINS THE SOURCE OF TRUTH — the artifact is a snapshot, pushed only when Nick
  explicitly asks.
- To push: `python3 scripts/build_artifact.py` (bundles everything into `build/artifact.html` —
  parses TOC from nav.js, namespaces all ids/anchors/SVG-marker refs per chapter, hash router #chN /
  #chN-anchor / #cover, inlines CSS + logomark, includes code-wrap + DRAFT badge; exits nonzero on
  leftover .html hrefs or duplicate ids) → then `update_artifact` with id `app-router-guide-draft`
  and the build path.
- `build/` is generated output — never edit it by hand.
- **Prettier (2026-07-16):** configured with ojl-tracker's exact `.prettierrc.yaml` (singleQuote,
  printWidth 100, trailingComma all, proseWrap always, mdx override). `npm run format` /
  `format:check`; `.prettierignore` excludes `build/` and `node_modules/` (note: markdown IS
  formatted — proseWrap: always will rewrap the .md notes). Sandbox npm registry is blocked — Nick
  runs `npm install` locally. After any repo-wide format pass, RE-RUN the full verification suite
  (svg_lint, HTML validity, link targets) since reflowed markup can shift what the linter parses;
  expect Edit old_strings to need re-reads afterward.
- All pages carry a fixed DRAFT badge (injected by nav.js locally; static div in the artifact).
  Remove both when the guide ships.

## Scope of content

Best practices, design patterns, component composition, data flow, data fetching (parallel, dedupe,
caching), component design (independence, isolation of interactivity into leaves), architecture
patterns, SSR approaches and benefits (content shifting/CLS, simplification), client/server
boundaries, parallel routes, Suspense/streaming, loading/error files, React 19 features (Actions,
use(), useOptimistic, compiler), Vercel direction (PPR, "use cache", cacheComponents).

## Context

Monorepo audit of team's app (recraft: 6 Next.js 16 UIs) completed 2026-07-13 →
`supplementary/audit.md`. Key findings: SPA-in-App-Router architecture; 73 pass-through proxy route
handlers; ~60% "use client" files; fetch-in-useEffect everywhere; zero server
actions/caching/streaming; client-side authorization; portal-ui is the in-house counter-example done
right. Local clone at `~/ai/recraft`.

## Status

- [x] Codebase audit (`supplementary/audit.md`)
- [x] Project scaffolding
- [ ] Research pass: verify Next 16 / React 19.x current state
- [ ] Guide skeleton (index.html, shared CSS, TOC)
- [x] §1–§13 written (Foundation + all of Part A + all of Part B + Part C's §12–§13). §6
      (2026-07-15): bundle=client module graphs, boundaries-before-dynamic(),
      dynamic()/ssr:false/top-level rule (verified vs current docs), handler-level await import(),
      candidates table, bundle-bars diagram. §8 (2026-07-15): request carries
      path/params/query/cookies = the known; URL-decomposition diagram (chips→rendered page);
      replace-vs-push; tabs-are-routes ladder (segments > ?view= > state) w/ compare + ProgramTabs;
      cookies=viewer vs URL=view, localStorage flash; interaction-not-identity test.
- [x] §7 Bundle Size & Code Splitting written + full renumber (2026-07-17).
- [ ] Remaining: §14 Component Breakdown, §15 Worked Example (the only stubs left).
- §5/§12 division of labor (2026-07-15, per Nick — deliberate overlap, examples repeated in both
  contexts): §5.7–5.9 own the BOUNDARY story (self-contained mutation buttons w/ useTransition +
  server action; dialogs/floating elements live in the button that opens them; parent refresh via
  server truth: revalidateTag/Path + router.refresh, URL-write search inputs, SWR keyed mutate when
  parent is legitimately client; God component = whole tree forced CSR, server features literally
  unavailable). §12.4 owns the WIRING story (onSuccess-callback vs invalidate-the-name compare; God
  hook = distribution network for one object's shape). Cross-linked both ways. God-hook example
  (useProgramsManager: fetch + UI state + callbacks in one) is GENERIC by request — inspired by
  recraft PR #1617's over-coupled providers but must never mirror that code recognizably (Nick
  doesn't want it obvious he's referencing a teammate's PR).
- Part B division of labor: §9 owns container doctrine/shifting/sizing (flex-grow-scroll frame,
  next/image, next/font); §10 owns Suspense mechanics + loading doctrine (8.4 slimmed to skeletons,
  defers containers to §9); §11 owns blocking scope, parallel fetching, parallel routes +
  default.tsx, client waterfalls.
- [ ] Iteration with Nick (ongoing)
- [ ] (LATER, on explicit go-ahead) Markdown → PDF → slide deck
