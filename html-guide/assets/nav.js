/* Shared navigation: single source of truth for the TOC.
   Each page has <div id="sidebar"></div> and <div id="pager"></div>;
   this script renders both based on the current filename. */

const TOC = [
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
      {
        n: '7',
        title: 'Bundle Size & Code Splitting',
        file: '07-bundle-size-code-splitting.html',
      },
      { n: '8', title: 'Server-Resolvable State', file: '08-server-resolvable-state.html' },
    ],
  },
  {
    part: 'Part B: Contain the Unknown',
    items: [
      {
        n: '9',
        title: 'Containers & Content Shifting',
        file: '09-containers-content-shifting.html',
      },
      { n: '10', title: 'Suspense & Streaming', file: '10-suspense-streaming.html' },
      { n: '11', title: 'Designing for the Unknown', file: '11-designing-for-the-unknown.html' },
      { n: '12', title: 'Blocking Requests', file: '12-blocking-requests.html' },
    ],
  },
  {
    part: 'Part C: Decouple the Parts',
    items: [
      { n: '13', title: 'Minimize the Wires', file: '13-minimize-the-wires.html' },
      { n: '14', title: 'Dedupe & Caching', file: '14-dedupe-caching.html' },
      { n: '15', title: 'Component Breakdown', file: '15-component-breakdown.html' },
    ],
  },
  {
    part: 'Part D: Applied',
    items: [
      { n: '16', title: 'Worked Example', file: '16-worked-example.html' },
      { n: '17', title: "Signs You're Doing It Wrong", file: '17-signs-doing-it-wrong.html' },
      { n: '18', title: 'Applied to Tracker', file: '18-applied-to-tracker.html' },
    ],
  },
  {
    part: 'Appendix',
    items: [
      { n: '19', title: 'New Primitives', file: '19-new-primitives.html' },
      { n: '20', title: 'References', file: '20-references.html' },
    ],
  },
];

/* Draft badge + annotation toolbar are rendered by the annotation module at
   the bottom of this file; remove that module when the guide ships. */

/* IDE-style code wrapping. Each pre.code is split into one div per source line;
   every line gets padding-left equal to its own indentation (plus a 2ch wrap
   offset) and an equal negative text-indent. Unwrapped lines render exactly as
   authored; wrapped continuation lines hang at the line's indentation, the way
   VS Code renders soft wraps. Done here because CSS's `text-indent: each-line`
   is not yet supported in Chrome. */
(function () {
  /* 0 replicates VS Code's default wrappingIndent: "same"; continuations
     align exactly at the line's own leading whitespace. */
  const WRAP_OFFSET = 0;
  document.querySelectorAll('pre.code').forEach(pre => {
    const lines = [];
    let line = document.createElement('div');
    line.className = 'code-line';
    const breakLine = () => {
      lines.push(line);
      line = document.createElement('div');
      line.className = 'code-line';
    };
    const addSplit = (text, makeNode) => {
      text.split('\n').forEach((part, i) => {
        if (i > 0) breakLine();
        if (part) line.appendChild(makeNode(part));
      });
    };
    let filename = null;
    Array.from(pre.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        addSplit(node.textContent, t => document.createTextNode(t));
      } else if (node.classList && node.classList.contains('filename')) {
        filename = node;
      } else if (node.textContent.includes('\n') && node.children.length === 0) {
        addSplit(node.textContent, t => {
          const s = node.cloneNode(false);
          s.textContent = t;
          return s;
        });
      } else {
        line.appendChild(node.cloneNode(true));
      }
    });
    lines.push(line);
    pre.textContent = '';
    if (filename) pre.appendChild(filename);
    lines.forEach(l => {
      const text = l.textContent;
      const lead = (text.match(/^ */) || [''])[0].length;
      const body = text.slice(lead);
      /* Comment openers hang their wraps where the comment TEXT starts, so
         soft wraps line up with the comment's authored continuation lines.
         Code lines hang at their own indentation (VS Code's "same"). */
      let hang = lead + WRAP_OFFSET;
      if (body.startsWith('{/*')) hang = lead + 4;
      else if (body.startsWith('/*')) hang = lead + 3;
      else if (body.startsWith('//')) hang = lead + 3;
      const indent = text.trim() ? hang : 0;
      l.style.paddingLeft = indent + 'ch';
      l.style.textIndent = -indent + 'ch';
      pre.appendChild(l);
    });
  });
})();

(function () {
  const here = location.pathname.split('/').pop();
  const inSections = location.pathname.includes('/sections/');
  const prefix = inSections ? '' : 'sections/';
  const homeHref = inSections ? '../index.html' : 'index.html';

  const flat = TOC.flatMap(g => g.items);
  const idx = flat.findIndex(i => i.file === here);

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const assetPrefix = inSections ? '../' : '';
    let html = `
      <a class="brand" href="${homeHref}" title="Back to the table of contents">
        <div style="display:flex;flex-direction:column;align-items:flex-start;">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
            <img class="mark" src="${assetPrefix}assets/logomark.svg" alt="Craft Education">
            <div class='brand-title'>App Router Guide</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0px;padding-left:34px">
            <div class="brand-sub">NextJS 16 App Router &middot; React 19</div>
          </div>
        </div>
        <svg class="brand-go" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
          <circle cx="2.5" cy="3.5" r="1.1" fill="currentColor"/>
          <line x1="6" y1="3.5" x2="14" y2="3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="2.5" cy="8" r="1.1" fill="currentColor"/>
          <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="2.5" cy="12.5" r="1.1" fill="currentColor"/>
          <line x1="6" y1="12.5" x2="14" y2="12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </a>`;
    html += `
      <div class="side-search">
        <input id="side-search-input" type="search" placeholder="Search the guide&hellip;  /"
          autocomplete="off" spellcheck="false" aria-label="Search the guide">
        <button id="side-search-clear" class="side-search-clear" type="button"
          aria-label="Clear search" hidden>
          <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
            <path d="M 2.5 2.5 L 11.5 11.5 M 11.5 2.5 L 2.5 11.5"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
          </svg>
        </button>
      </div>
      <div id="side-search-results" hidden></div>`;
    html += '<div id="side-toc">';
    for (const group of TOC) {
      if (group.part) html += `<div class="part-label">${group.part}</div>`;
      for (const item of group.items) {
        const cls = item.file === here ? 'toc-item current' : 'toc-item';
        html += `<a class="${cls}" href="${prefix}${item.file}"><span class="n">${item.n}</span>${item.title}</a>`;
      }
    }
    html += '</div>';
    sidebar.innerHTML = html;

    /* Keep the sidebar's scroll position across page loads. Each chapter is
       its own document, so without this the sidebar snaps back to the top on
       every navigation. Save continuously, restore after render, and fall
       back to scrolling the current item into view (first visit, deep link,
       or a stale position that would hide it). */
    const SCROLL_KEY = 'arg-sidebar-scroll';
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) sidebar.scrollTop = parseInt(saved, 10) || 0;
    const current = sidebar.querySelector('.toc-item.current');
    if (current) {
      const top = current.offsetTop - sidebar.scrollTop;
      if (top < 0 || top > sidebar.clientHeight - current.offsetHeight) {
        sidebar.scrollTop =
          current.offsetTop - sidebar.clientHeight / 2 + current.offsetHeight / 2;
      }
    }
    sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop));
    sidebar.addEventListener(
      'scroll',
      () => {
        // Don't record positions from the search-results view; only the TOC's.
        const toc = document.getElementById('side-toc');
        if (toc && toc.hidden) return;
        sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop));
      },
      { passive: true }
    );

    /* ---- sidebar search over the build-time index (search-index.js) ---- */
    const searchInput = document.getElementById('side-search-input');
    const resultsEl = document.getElementById('side-search-results');
    const tocEl = document.getElementById('side-toc');
    if (searchInput && resultsEl && tocEl) {
      const esc = s =>
        s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let active = -1;

      const highlight = (text, tokens) => {
        const re = new RegExp('(' + tokens.map(t => escRe(esc(t))).join('|') + ')', 'gi');
        return esc(text).replace(re, '<mark>$1</mark>');
      };

      const search = q => {
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
        const index = (window.ARG_SEARCH_INDEX && window.ARG_SEARCH_INDEX.entries) || [];
        const scored = [];
        for (const e of index) {
          const h = e.h.toLowerCase();
          const t = e.t.toLowerCase();
          const c = e.c.toLowerCase();
          let score = 0;
          let ok = true;
          for (const tok of tokens) {
            const inH = h.includes(tok);
            const inC = c.includes(tok);
            const inT = t.includes(tok);
            if (!inH && !inC && !inT) {
              ok = false;
              break;
            }
            if (inH) score += 20;
            if (inC) score += 8;
            if (inT) score += 3;
            if (inH && new RegExp('\\b' + escRe(tok)).test(h)) score += 6;
          }
          if (ok) scored.push([score, e]);
        }
        scored.sort((a, b) => b[0] - a[0]);
        return { tokens, hits: scored.slice(0, 15).map(x => x[1]) };
      };

      const snippet = (e, tokens) => {
        const lower = e.t.toLowerCase();
        let pos = -1;
        for (const tok of tokens) {
          const i = lower.indexOf(tok);
          if (i !== -1 && (pos === -1 || i < pos)) pos = i;
        }
        if (pos === -1) return '';
        const start = Math.max(0, pos - 55);
        let s = e.t.slice(start, start + 160);
        if (start > 0) s = '…' + s;
        if (start + 160 < e.t.length) s += '…';
        return highlight(s, tokens);
      };

      const render = q => {
        active = -1;
        if (!q) {
          resultsEl.hidden = true;
          resultsEl.innerHTML = '';
          tocEl.hidden = false;
          return;
        }
        const { tokens, hits } = search(q);
        tocEl.hidden = true;
        resultsEl.hidden = false;
        if (!window.ARG_SEARCH_INDEX) {
          resultsEl.innerHTML =
            '<div class="sr-empty">Search index not found; run <code>npm run build</code> once to generate it.</div>';
          return;
        }
        if (!hits.length) {
          resultsEl.innerHTML =
            '<div class="sr-empty">No matches. Try fewer or different words.</div>';
          return;
        }
        resultsEl.innerHTML = hits
          .map(e => {
            const href = prefix + e.f + (e.a ? '#' + e.a : '');
            return (
              `<a class="sr-item" href="${href}">` +
              `<span class="sr-chapter">${e.n} · ${esc(e.c)}</span>` +
              `<span class="sr-heading">${highlight(e.h || e.c, tokens)}</span>` +
              `<span class="sr-snippet">${snippet(e, tokens)}</span>` +
              `</a>`
            );
          })
          .join('');
        sidebar.scrollTop = 0;
      };

      const setActive = next => {
        const items = resultsEl.querySelectorAll('.sr-item');
        if (!items.length) return;
        active = (next + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle('active', i === active));
        items[active].scrollIntoView({ block: 'nearest' });
      };

      const clearBtn = document.getElementById('side-search-clear');
      const syncClear = () => {
        if (clearBtn) clearBtn.hidden = !searchInput.value;
      };
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchInput.value = '';
          render('');
          syncClear();
          searchInput.focus();
        });
      }
      searchInput.addEventListener('input', () => {
        render(searchInput.value.trim());
        syncClear();
      });
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActive(active + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActive(active - 1);
        } else if (e.key === 'Enter') {
          const items = resultsEl.querySelectorAll('.sr-item');
          const target = items[active === -1 ? 0 : active];
          if (target) target.click();
        } else if (e.key === 'Escape') {
          searchInput.value = '';
          render('');
          syncClear();
          searchInput.blur();
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const t = document.activeElement;
          const typing =
            t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
          if (!typing) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
          }
        }
      });
    }
  }

  const pager = document.getElementById('pager');
  if (pager && idx !== -1) {
    const prev = flat[idx - 1],
      next = flat[idx + 1];
    let html = '';
    html += prev
      ? `<a href="${prefix}${prev.file}"><span class="dir">&larr; Previous</span><span class="title">${prev.n}. ${prev.title}</span></a>`
      : `<span style="flex:1"></span>`;
    html += next
      ? `<a class="next" href="${prefix}${next.file}"><span class="dir">Next &rarr;</span><span class="title">${next.n}. ${next.title}</span></a>`
      : `<span style="flex:1"></span>`;
    pager.className = 'pager';
    pager.innerHTML = html;
  }
})();

