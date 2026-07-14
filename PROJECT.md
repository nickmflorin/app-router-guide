# App Router Guide — Project Tracker

**Owner:** Nick (nick.florin@crafteducation.com) · **Started:** 2026-07-13
**Purpose:** Improve the team's understanding of the Next.js App Router, React 19 best practices, SSR patterns, and the direction React/Vercel are heading. Nick presents to the team in ~2 weeks.

## Artifacts (in order)

1. **HTML guide** (`index.html` + `sections/*.html`, shared styles in `assets/`) — the canonical document. Styled, browser-renderable, native SVG/HTML diagrams. **We iterate on this alone until Nick explicitly says to start deriving other artifacts.**
2. Markdown document — generated later from (1), must be 1-1 with it. SVG diagrams convert to mermaid.
3. PDF — generated later from (1).
4. HTML slide deck — summarized (less detailed) version for the team presentation.

## Decisions log

- 2026-07-13: Folder-with-index structure (not single file).
- 2026-07-13: Examples = both generic in main flow + "applied to recraft" material using real before/after from the audit.
- 2026-07-13: Content sourced from knowledge + verified with fresh web research (Next 16 / React 19 features post-date knowledge cutoff).
- External references tracked in `references.md` as we go; rendered at the bottom of the documents.
- 2026-07-13: Nick provided raw content notes (`nick-notes.md`) — the guide's outline derives from them. Core thesis: known vs. unknown at first render; maximize the known (SSR); containers reserve space; push interactivity to leaves; minimize wires (props/callbacks); use the URL more; "Signs You're Doing It Wrong" is a first-class section.
- 2026-07-13: ~~Authority spectrum (framework/strong rec/rec)~~ REPLACED by Nick's request with an **importance metric**: **Critical** / **Very important** / **Important** (chips: chip-critical red, chip-very amber, chip-imp blue). Mapping applied: framework behavior & strong recs → Critical; plain recommendations → Very important. Nothing discussed so far rates below Very important; "Important" reserved for future lower-stakes habits. Practices still name their legitimate exceptions.
- 2026-07-13: Diagrams styled after Next.js docs (their palette, clean geometric style). Running worked example: page header + data table (parallel routes, containers in layout, suspense placement, deferred values, flex-grow scroll, deduped queries).

## Approved document outline (2026-07-13)

Taxonomy decision: **Known/Unknown thesis** — separate what can be known at first render from what cannot; three meta-goals: (A) Maximize the Known, (B) Contain the Unknown, (C) Decouple the Parts. Goals section lists ends only; later chapters elaborate each goal with its techniques (one primary home per technique + cross-references).

- §1 Introduction — Nick's voice (don't fight the framework; stakes; world-of-pain warning); chip legend (authority: framework behavior / strong rec / rec; scope: React vs Next)
- §2 The Goals — thesis + A/B/C meta-goals, chipped sub-goals, links to chapters. High-level only.
- §3 The Mental Model — 3.1 Direction of travel (React/Vercel converging on server-first; every new primitive assumes it; SPA-model is legacy — narrative only, feature details stay in §16); 3.2 The new rendering model (server-first, RSC payload, hydration, file-based routing, "app dir is your app's scaffold, not routes"); 3.3 Why the old mental model bites later
- Part A — Maximize the Known: §4 Client/server boundaries (interactivity to leaves, "use client", wrapping 3rd party, children pattern) · §5 First-render JS (dynamic imports) · §6 Server-resolvable state (URL, params, cookies; tabs-in-state smell)
- Part B — Contain the Unknown: §7 Containers & content shifting (containers known/reserve space; loading belongs to boundaries) · §8 Suspense & streaming (triggers, placement diagram, loading/error files, useDeferredValue + table problem) · §9 Blocking requests (parallel fetching, minimize fetch deps, parallel routes + default.tsx)
- Part C — Decouple the Parts: §10 Minimize the wires · §11 Dedupe & caching (fetch dedupe, React cache, "use cache"/cacheComponents, SWR) · §12 Component breakdown (one per file, portability)
- Part D — Applied: §13 Worked example (page header + data table) · §14 Signs You're Doing It Wrong (checklist, links back) · §15 Applied to recraft (before/after from audit)
- §16 New Primitives (lower priority; details of Server Actions, form hooks, ViewTransition, Activity, useEffectEvent, compiler)
- §17 References

## Working agreements (remember across sessions)

- **Miro screenshots from Nick are rough idea sketches only.** He may paste screenshots of diagrams he's making in Miro solely to communicate the general idea — they are sloppy, loosely worded, and not detailed by his own description. Do NOT reproduce them literally. Take full design liberties: extract the concept, then design the real diagram properly (Next.js-docs style, polished labels, accurate terminology). They communicate to Claude, not to the doc's reader.
- **Code-comment style in all examples:** written like sentences (proper capitalization, punctuation); always placed ABOVE the code they reference, never trailing/inline; multi-line comments always use `/* ... */` (JSX: `{/* ... */}`). Nick's ojl-tracker (old craft repo) has reference examples if ever cloned.
- **Client components reading useSearchParams always ship with their own baked-in Suspense boundary** (§4.6 pattern) — the exported component wraps its inner reader.
- **Tables:** cells always wrap (no nowrap columns — page must never scroll horizontally); every table row bolds its key 4-5 word phrase (e.g. "never define their own loading states").
- **Diagram palette (per Nick, no purple):** blue = server/known, sky = client/interactive, AMBER/warning = unknown/suspended/waiting (also fetches, origin), green = good/content, red = bad. Part B branding (goal-B letter, TOC) is amber to match. Purple is banned from diagrams; code-token violet (tok-prop) is allowed.
- **BRANDED (2026-07-14): colors come from the Craft Education design system** (Claude Design export, Desktop zip → /tmp/ds; also `recraft/packages/ui/src/styles/*.css`). Tokens in use: primary #0070F0 (dark #004696, light #E8F2FF), navy secondary #002855 (headings, chip-next, goal-C, brand), sky #46B1EF (interactive strokes; text uses info #016CAA, muted #35789F), success #06764D/#E5FDCF (+ lime-tint bars #D5F3B3), warning #B54708/#FEF0C7 (+ skeleton bars #F7DE9F), error #B42318/#FEE4E2. Colors only — fonts (Sora/DM Sans) deliberately NOT adopted; guide keeps Inter/mono.
- **Diagram layout rules:** consistent small inner margins on all edges (trim empty viewBox space; figure padding is 14px); text never overlaps boxes/edges — wrap the label or widen the box; neutral bottom-of-SVG explainer texts are forbidden — that content belongs in the figcaption (per-panel colored verdict lines and axis/timeline labels may stay in the SVG).
- **Diagram geometry rules (per Nick):** arrows are straight (horizontal, vertical, or clean mirrored diagonals), consistently curved, or segmented straight lines — never wobbly S-curves; labels must never overlap arrows (offset ≥10px, use text-anchor start/end away from the line); left/right halves of a panel mirror each other; multi-line annotations vertically centered against the box they describe; boxes in the same row/column share exact coordinates.
- **Code line-length budgets:** ≤54 chars in compare columns, ≤110 in full-width blocks (verify with the measuring script pattern in session history). nav.js provides IDE-style soft-wrap (VS Code "same" + comment-text alignment) as a safety net only — authored lines should never wrap at normal widths.
- **The guide should be diagram-heavy.** Detailed text too, but prefer a diagram wherever one can carry the idea. Native SVG in the HTML doc (→ mermaid later in the Markdown derivation).
- Style/voice/visual template approved by Nick 2026-07-13 based on §1–§3.
- **Every section must reference BOTH the Next.js docs AND the React 19 docs** (react.dev) in its "where to go deeper" links — not just Next.js. Log all in references.md.
- Loading-state doctrine (Nick, for §8 and everywhere relevant): components never define their own loading states; skeletons per server/client component (never page-level), never shown on refetch; SWR pattern = never replace existing content while revalidating, only indicate alongside stale content; `isLoading` is applied independently of data presence (no if-loading-else-if-data chains); empty state shown iff request finished AND returned no data; data layer must NOT default undefined → [] because it destroys the unknown-vs-known-empty distinction. His old `craft` repo (ojl-tracker, craft-ui workspaces) has his reference DataTable/loading-indicator patterns — not currently cloned; mine it if he provides it.

## Scope of content

Best practices, design patterns, component composition, data flow, data fetching (parallel, dedupe, caching), component design (independence, isolation of interactivity into leaves), architecture patterns, SSR approaches and benefits (content shifting/CLS, simplification), client/server boundaries, parallel routes, Suspense/streaming, loading/error files, React 19 features (Actions, use(), useOptimistic, compiler), Vercel direction (PPR, "use cache", cacheComponents).

## Context

Monorepo audit of team's app (recraft: 6 Next.js 16 UIs) completed 2026-07-13 → `recraft-app-router-audit.md`. Key findings: SPA-in-App-Router architecture; 73 pass-through proxy route handlers; ~60% "use client" files; fetch-in-useEffect everywhere; zero server actions/caching/streaming; client-side authorization; portal-ui is the in-house counter-example done right. Local clone at `~/ai/recraft`.

## Status

- [x] Codebase audit (`recraft-app-router-audit.md`)
- [x] Project scaffolding
- [ ] Research pass: verify Next 16 / React 19.x current state
- [ ] Guide skeleton (index.html, shared CSS, TOC)
- [x] §1–4, 7–11 written (Foundation + Part A's §4 + all of Part B + Part C's §10–11)
- [ ] Remaining: §5, §6, §12, Part D (§13–15), §16, §17
- Part B division of labor: §7 owns container doctrine/shifting/sizing (flex-grow-scroll frame, next/image, next/font); §8 owns Suspense mechanics + loading doctrine (8.4 slimmed to skeletons, defers containers to §7); §9 owns blocking scope, parallel fetching, parallel routes + default.tsx, client waterfalls.
- [ ] Iteration with Nick (ongoing)
- [ ] (LATER, on explicit go-ahead) Markdown → PDF → slide deck
