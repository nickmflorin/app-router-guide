/* Runtime chrome for the SHIPPED guide (and dev): IDE-style code wrapping,
   sidebar scroll persistence, the search box, and the pager. The sidebar and
   pager markup are server-rendered (Sidebar.astro / GuidePage.astro from
   src/data/toc.js); this script only attaches behavior. It stays a CLASSIC
   external script (not a module) because the guide must work over file://,
   where module scripts are blocked by CORS. The dev-only tooling module
   (notes + deck designation, under src/dev/) never ships. */

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
  const inSections = location.pathname.includes('/sections/');
  /* Search-result links are page-relative: '' from a section page, sections/
     from the cover. */
  const prefix = inSections ? '' : 'sections/';

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    /* Keep the sidebar's scroll position across page loads. Each chapter is
       its own document, so without this the sidebar snaps back to the top on
       every navigation. Save continuously, restore after render, and fall
       back to scrolling the current item into view (first visit, deep link,
       or a stale position that would hide it). */
    const SCROLL_KEY = 'arg-sidebar-scroll';
    const scroller = document.getElementById('side-scroll');
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved !== null) scroller.scrollTop = parseInt(saved, 10) || 0;
    const current = sidebar.querySelector('.toc-item.current');
    if (current) {
      const top = current.offsetTop - scroller.scrollTop;
      if (top < 0 || top > scroller.clientHeight - current.offsetHeight) {
        scroller.scrollTop =
          current.offsetTop - scroller.clientHeight / 2 + current.offsetHeight / 2;
      }
    }
    sessionStorage.setItem(SCROLL_KEY, String(scroller.scrollTop));
    scroller.addEventListener(
      'scroll',
      () => {
        // Don't record positions from the search-results view; only the TOC's.
        const toc = document.getElementById('side-toc');
        if (toc && toc.hidden) return;
        sessionStorage.setItem(SCROLL_KEY, String(scroller.scrollTop));
      },
      { passive: true },
    );

    /* ---- sidebar search over the build-time index (search-index.js) ---- */
    const searchInput = document.getElementById('side-search-input');
    const resultsEl = document.getElementById('side-search-results');
    const tocEl = document.getElementById('side-toc');
    if (searchInput && resultsEl && tocEl) {
      const esc = s =>
        s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
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
        scroller.scrollTop = 0;
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

  /* Pager: the div is server-rendered empty with its neighbours as data
     attributes (GuidePage.astro); build the links here. */
  const pager = document.getElementById('pager');
  if (pager) {
    const d = pager.dataset;
    let html = '';
    html += d.prevHref
      ? `<a href="${d.prevHref}"><span class="dir">&larr; Previous</span><span class="title">${d.prevLabel}</span></a>`
      : `<span style="flex:1"></span>`;
    html += d.nextHref
      ? `<a class="next" href="${d.nextHref}"><span class="dir">Next &rarr;</span><span class="title">${d.nextLabel}</span></a>`
      : `<span style="flex:1"></span>`;
    pager.className = 'pager';
    pager.innerHTML = html;
  }
})();
