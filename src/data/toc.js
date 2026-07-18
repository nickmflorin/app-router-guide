/* Single source of truth for the TOC. The runtime sidebar (public/assets/nav.js)
   still carries its own copy for now; these merge in Phase 2. */
export const TOC = [
  {
    part: 'Foundation',
    items: [
      { n: '1', title: 'Introduction', file: '01-introduction.html' },
      { n: '2', title: 'The Goals', file: '02-goals.html' },
      { n: '3', title: 'The Mental Model', file: '03-mental-model.html' },
    ],
  },
  {
    part: 'Part A: Maximize the Known',
    items: [
      { n: '4', title: 'Server-Side Rendering', file: '04-ssr.html' },
      { n: '5', title: 'Client/Server Boundaries', file: '05-client-server-boundaries.html' },
      { n: '6', title: 'First-Render JavaScript', file: '06-first-render-js.html' },
      { n: '7', title: 'Bundle Size & Code Splitting', file: '07-bundle-size-code-splitting.html' },
      { n: '8', title: 'Server-Resolvable State', file: '08-server-resolvable-state.html' },
    ],
  },
  {
    part: 'Part B: Contain the Unknown',
    items: [
      { n: '9', title: 'Containers & Content Shifting', file: '09-containers-content-shifting.html' },
      { n: '10', title: 'Suspense & Streaming', file: '10-suspense-streaming.html' },
      { n: '11', title: 'Blocking Requests', file: '11-blocking-requests.html' },
    ],
  },
  {
    part: 'Part C: Decouple the Parts',
    items: [
      { n: '12', title: 'Minimize the Wires', file: '12-minimize-the-wires.html' },
      { n: '13', title: 'Dedupe & Caching', file: '13-dedupe-caching.html' },
      { n: '14', title: 'Component Breakdown', file: '14-component-breakdown.html' },
    ],
  },
  {
    part: 'Part D: Applied',
    items: [
      { n: '15', title: 'Worked Example', file: '15-worked-example.html' },
      { n: '16', title: "Signs You're Doing It Wrong", file: '16-signs-doing-it-wrong.html' },
      { n: '17', title: 'Applied to recraft', file: '17-applied-to-recraft.html' },
    ],
  },
  {
    part: 'Appendix',
    items: [
      { n: '18', title: 'New Primitives', file: '18-new-primitives.html' },
      { n: '19', title: 'References', file: '19-references.html' },
    ],
  },
];
