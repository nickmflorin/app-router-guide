/* Stamps stable, deck-addressable data-content-id attributes onto the guide's block-level content
   regions, so the slide-deck tooling can designate ANY block (not just diagrams/snippets) onto a
   slide.

   Server-side only: GuidePage.astro renders its slot to an HTML string and passes it through
   stampContentIds() on the SAME code path in dev and in `astro build`, so ids are identical in
   both. Nothing here ships to the client.

   Id scheme (matches Diagram.astro/Snippet.astro): "<page>::<type>::<n>", where <type> is the
   block's tag name (p, h1, h2, h3, table, ul, ol) or its semantic class (callout, compare,
   goal-card), and <n> is the 1-based ordinal of that type on the page in document order. Diagram
   and Snippet keep emitting their own ids ("diagram"/"snippet") from their per-render counters;
   this pass never restamps an element that already carries one.

   Stamped regions are ATOMIC: nothing inside an already-stamped element (or inside a
   Diagram/Snippet, an <svg>, or a <template>) is stamped again, so the clickable regions tile the
   page instead of nesting. Clicking anywhere in a list designates the whole list; a snippet inside
   a <Compare> remains individually selectable because Snippet.astro emitted its id itself.

   Like the diagram/snippet ordinals, ids are positional: inserting a block above another shifts
   later ids of that type on the page. Re-check deck designations after restructuring a page. */

const TAG_TYPES = new Set(['p', 'h1', 'h2', 'h3', 'table', 'ul', 'ol']);
const CLASS_TYPES = ['callout', 'compare', 'goal-card'];
/* Matches an HTML comment (ignored) or one tag; attribute values may contain quoted ">"
   characters. */
const TOKEN_RE =
  /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;

export function stampContentIds(html, slug) {
  const counters = Object.create(null);
  let skip = null; /* { tag, depth } while inside an atomic region */
  let out = '';
  let last = 0;
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    const [full, close, rawTag, attrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (skip) {
      if (tag === skip.tag && !selfClose) skip.depth += close ? -1 : 1;
      if (skip.depth === 0) skip = null;
      continue;
    }
    if (close) continue;
    if (attrs.includes('data-content-id') || tag === 'svg' || tag === 'template') {
      if (!selfClose) skip = { tag, depth: 1 };
      continue;
    }
    let type = null;
    if (TAG_TYPES.has(tag)) {
      type = tag;
    } else if (tag === 'div') {
      const cm = attrs.match(/class=(["'])(.*?)\1/);
      const cls = cm ? ` ${cm[2]} ` : '';
      type = CLASS_TYPES.find(t => cls.includes(` ${t} `)) || null;
    }
    if (!type) continue;
    counters[type] = (counters[type] || 0) + 1;
    const id = `${slug}::${type}::${counters[type]}`;
    const insertAt = m.index + full.length - (selfClose ? 2 : 1);
    out += html.slice(last, insertAt) + ` data-content-id="${id}"`;
    last = insertAt;
    if (!selfClose) skip = { tag, depth: 1 };
  }
  return out + html.slice(last);
}
