/* THE single source of truth for the guide's table of contents. Everything
   else derives from this file: the sidebar and pager (Sidebar.astro +
   GuidePage.astro), the cover's Contents grid (index.astro), and the build
   scripts (build_artifact.py, build_md.py, build_search_index.py), which
   parse it with a tolerant regex.

   Per group: `part` is the visible label, `cls` the cover grid's part-name
   color class. Per item: `n` chapter number, `title`, `file` (built page
   name), `d` the one-line description shown on the cover.

   RESTRUCTURING: when chapters are added/removed/reordered, this file is the
   only TOC to update (plus kickers, heading numbers, and cross-references;
   see CONTEXT.md). */

export const TOC = [
  {
    part: 'Foundation',
    cls: 'pz',
    items: [
      {
        n: '1',
        title: 'Introduction',
        file: '01-introduction.html',
        d: "don't fight the framework",
      },
      {
        n: '2',
        title: 'The Goals',
        file: '02-goals.html',
        d: "what you're optimizing, on every page",
      },
      {
        n: '3',
        title: 'The Mental Model',
        file: '03-mental-model.html',
        d: 'what a render actually is, and why the old model breaks',
      },
    ],
  },
  {
    part: 'Part A: Maximize the Known',
    cls: 'pa',
    items: [
      {
        n: '4',
        title: 'Server-Side Rendering',
        file: '04-ssr.html',
        d: 'what it is, and why the server wins',
      },
      {
        n: '5',
        title: 'Client/Server Boundaries',
        file: '05-client-server-boundaries.html',
        d: 'push interactivity to the leaves',
      },
      {
        n: '6',
        title: 'Bootstrapping the First Paint',
        file: '06-bootstrapping-first-paint.html',
        d: "complete paint when URL state won't fit; idle-deferred client twin",
      },
      {
        n: '7',
        title: 'First-Render JavaScript',
        file: '07-first-render-js.html',
        d: 'dynamic imports, heavy dependencies',
      },
      {
        n: '8',
        title: 'Bundle Size & Code Splitting',
        file: '08-bundle-size-code-splitting.html',
        d: 'wholesale components, heavy imports, barrels',
      },
      {
        n: '9',
        title: 'Server-Resolvable State',
        file: '09-server-resolvable-state.html',
        d: 'use the URL more',
      },
    ],
  },
  {
    part: 'Part B: Contain the Unknown',
    cls: 'pb',
    items: [
      {
        n: '10',
        title: 'Containers & Content Shifting',
        file: '10-containers-content-shifting.html',
        d: 'containers are known; they reserve space',
      },
      {
        n: '11',
        title: 'Suspense & Streaming',
        file: '11-suspense-streaming.html',
        d: 'boundary placement, streaming, loading files',
      },
      {
        n: '12',
        title: 'Error Boundaries',
        file: '12-error-boundaries.html',
        d: 'granular error.tsx, parallel-route isolation, custom boundaries',
      },
      {
        n: '13',
        title: 'Designing for the Unknown',
        file: '13-designing-for-the-unknown.html',
        d: 'stability is designed with UX, not retrofitted',
      },
      {
        n: '14',
        title: 'Blocking Requests',
        file: '14-blocking-requests.html',
        d: 'parallel fetching, parallel routes',
      },
    ],
  },
  {
    part: 'Part C: Decouple the Parts',
    cls: 'pc',
    items: [
      {
        n: '15',
        title: 'Minimize the Wires',
        file: '15-minimize-the-wires.html',
        d: 'props, callbacks, and repetition over dependency',
      },
      {
        n: '16',
        title: 'Dedupe & Caching',
        file: '16-dedupe-caching.html',
        d: 'fetch dedupe, React cache, "use cache", SWR',
      },
      {
        n: '17',
        title: 'Component Breakdown',
        file: '17-component-breakdown.html',
        d: 'by UI and responsibility; one per file',
      },
    ],
  },
  {
    part: 'Part D: Applied',
    cls: 'pd',
    items: [
      {
        n: '18',
        title: "Signs You're Doing It Wrong",
        file: '18-signs-doing-it-wrong.html',
        d: 'the checklist, grouped by category',
      },
      {
        n: '19',
        title: 'Applied to Tracker',
        file: '19-applied-to-tracker.html',
        d: 'the audit: findings, and where each fix lives',
      },
    ],
  },
  {
    part: 'Appendix',
    cls: 'pz',
    items: [
      {
        n: '20',
        title: 'New Primitives',
        file: '20-new-primitives.html',
        d: 'Actions, form hooks, ViewTransition, Activity',
      },
      {
        n: '21',
        title: 'References',
        file: '21-references.html',
        d: 'every source used in this guide',
      },
    ],
  },
];
