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

/* ------------------------------------------------------------------------
   Draft annotation layer - LOCAL DEV ONLY.

   The whole module (DRAFT badge, note mode, pins, panel, ledger auto-sync)
   activates only on the astro dev server. The built html-guide/ output is
   final: no badge, no annotation UI, and the ledger (page-notes.json) is
   stripped from it at build time (scripts/postbuild_relativize.py).

   "Add note" arms note mode: click any block (paragraph, diagram, code,
   table, callout...) and type a note. Notes render as numbered amber pins
   in the left gutter, persist in localStorage, and sync against the
   append-only ledger in public/page-notes.json so Claude can act on them.
   Keyboard: Escape exits note mode or closes the dialog. */
(function () {
  const IS_DEV =
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1') &&
    location.protocol.startsWith('http');
  if (!IS_DEV) return;
  const KEY = 'arg-notes-v1';
  const page = location.pathname.split('/').pop() || 'index.html';
  const BLOCKS =
    'figure.diagram, pre.code, table, .callout, .compare, .goal-card, li, p, h1, h2, h3';

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return d && Array.isArray(d.notes) ? d : { notes: [] };
    } catch (e) {
      return { notes: [] };
    }
  }
  function persist() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  let data = load();
  const pageNotes = () => data.notes.filter(n => n.page === page);

  /* ---------- targeting: describe a block so it can be found again ---------- */
  function nearestHeading(el) {
    let best = null;
    document.querySelectorAll('.content-inner h2[id], .content-inner h3[id]').forEach(h => {
      if (h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) best = h;
    });
    return best ? best.id : null;
  }
  function buildTarget(el) {
    const root = document.querySelector('.content-inner') || document.body;
    const path = [];
    let cur = el;
    while (cur && cur !== root && cur.parentElement) {
      path.unshift(Array.prototype.indexOf.call(cur.parentElement.children, cur));
      cur = cur.parentElement;
    }
    return {
      anchor: nearestHeading(el),
      path: path,
      tag: el.tagName.toLowerCase(),
      snippet: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90),
    };
  }
  function resolveTarget(t) {
    const root = document.querySelector('.content-inner') || document.body;
    let cur = root;
    for (const idx of t.path || []) {
      if (!cur || !cur.children[idx]) {
        cur = null;
        break;
      }
      cur = cur.children[idx];
    }
    if (cur && cur.tagName.toLowerCase() === t.tag) return cur;
    /* Structure shifted since the note was taken: fall back to the snippet. */
    let found = null;
    root.querySelectorAll(t.tag).forEach(el => {
      if (!found && (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 90) === t.snippet)
        found = el;
    });
    return found;
  }

  /* ---------- toolbar ---------- */
  const tools = document.createElement('div');
  tools.className = 'draft-tools';
  tools.innerHTML =
    '<span class="draft-badge">DRAFT</span>' +
    '<button type="button" class="note-btn" data-act="panel"></button>' +
    '<button type="button" class="note-btn" data-act="arm">+ Add note</button>';
  document.body.appendChild(tools);
  const panelBtn = tools.querySelector('[data-act="panel"]');
  const armBtn = tools.querySelector('[data-act="arm"]');

  /* ---------- pins ---------- */
  const pinLayer = document.createElement('div');
  document.body.appendChild(pinLayer);
  function renderPins() {
    pinLayer.textContent = '';
    pageNotes().forEach((n, i) => {
      if (n.status === 'resolved') return;
      const el = resolveTarget(n.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pin = document.createElement('div');
      pin.className = 'note-pin';
      pin.textContent = String(i + 1);
      pin.title = n.text;
      pin.style.top = window.scrollY + r.top + 'px';
      pin.style.left = Math.max(6, window.scrollX + r.left - 30) + 'px';
      pin.addEventListener('click', () => {
        openPanel();
        flash(el);
      });
      pinLayer.appendChild(pin);
    });
    panelBtn.textContent = 'Notes (' + pageNotes().filter(n => n.status !== 'resolved').length + ')';
  }
  let repositionTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(repositionTimer);
    repositionTimer = setTimeout(renderPins, 150);
  });
  function flash(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.remove('note-flash');
    void el.offsetWidth;
    el.classList.add('note-flash');
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'note-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  /* ---------- note mode ---------- */
  let armed = false;
  let hovered = null;
  function setArmed(on) {
    armed = on;
    document.body.classList.toggle('note-mode', on);
    armBtn.classList.toggle('active', on);
    armBtn.textContent = on ? 'Click a block… (Esc)' : '+ Add note';
    if (!on && hovered) {
      hovered.classList.remove('note-hover-outline');
      hovered = null;
    }
  }
  armBtn.addEventListener('click', () => setArmed(!armed));
  document.addEventListener('mouseover', e => {
    if (!armed) return;
    const block = e.target.closest && e.target.closest(BLOCKS);
    if (hovered && hovered !== block) hovered.classList.remove('note-hover-outline');
    hovered = block;
    if (block) block.classList.add('note-hover-outline');
  });
  document.addEventListener(
    'click',
    e => {
      if (!armed) return;
      if (e.target.closest('.draft-tools, .notes-panel, .note-dialog, .note-pin')) return;
      const block = e.target.closest(BLOCKS);
      if (!block) return;
      e.preventDefault();
      e.stopPropagation();
      setArmed(false);
      openDialog(block);
    },
    true,
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setArmed(false);
      closeDialog();
    }
  });

  /* ---------- dialog ---------- */
  /* Crash-safe editing: the note is persisted to localStorage the moment the
     dialog opens (so a hot reload can't lose it), and every keystroke
     autosaves on a short debounce. "Done" just closes; "Discard" deletes.
     Notes left empty are discarded on close. */
  let dialog = null;
  function closeDialog() {
    if (dialog) {
      if (dialog._flush) dialog._flush();
      dialog.remove();
      dialog = null;
    }
  }
  function removeNote(note) {
    data.notes = data.notes.filter(x => x.id !== note.id);
    persist();
    renderPins();
    renderPanel();
  }
  function openDialog(block, existing) {
    closeDialog();
    let note = existing;
    if (!note) {
      note = {
        id: 'n' + Date.now().toString(36),
        page: page,
        ts: new Date().toISOString(),
        status: 'open',
        text: '',
        target: buildTarget(block),
      };
      data.notes.push(note);
      persist();
      renderPins();
    }
    dialog = document.createElement('div');
    dialog.className = 'note-dialog';
    dialog.innerHTML =
      '<div class="np-where" style="margin-bottom:6px;color:#8a5a00;font-size:11px"></div>' +
      '<textarea placeholder="What should change here? (autosaves as you type)"></textarea>' +
      '<div class="nd-actions">' +
      '<button type="button" class="note-btn" data-act="discard">Discard</button>' +
      '<button type="button" class="note-btn active" data-act="done">Done</button></div>';
    dialog.querySelector('.np-where').textContent = '“' + note.target.snippet.slice(0, 70) + '…”';
    const ta = dialog.querySelector('textarea');
    ta.value = note.text;
    let autosaveTimer = null;
    function commit() {
      clearTimeout(autosaveTimer);
      note.text = ta.value.trim();
      persist();
      renderPins();
      renderPanel();
    }
    ta.addEventListener('input', () => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(commit, 250);
    });
    /* Whatever closes the dialog (Done, Escape, another dialog opening),
       the latest text is flushed first; empty notes are dropped. */
    dialog._flush = () => {
      commit();
      if (!note.text) removeNote(note);
    };
    dialog.querySelector('[data-act="discard"]').addEventListener('click', () => {
      dialog._flush = null;
      removeNote(note);
      closeDialog();
      toast('Note discarded');
    });
    dialog.querySelector('[data-act="done"]').addEventListener('click', () => {
      const keep = ta.value.trim();
      closeDialog();
      if (keep) flash(block || document.body);
      else toast('Empty note discarded');
    });
    document.body.appendChild(dialog);
    ta.focus();
  }

  /* ---------- panel ---------- */
  let panel = null;
  function openPanel() {
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'notes-panel';
      document.body.appendChild(panel);
    }
    renderPanel();
  }
  function closePanel() {
    if (panel) {
      panel.remove();
      panel = null;
    }
  }
  panelBtn.addEventListener('click', () => (panel ? closePanel() : openPanel()));
  function renderPanel() {
    if (!panel) return;
    const openCount = data.notes.filter(n => n.status !== 'resolved').length;
    panel.innerHTML =
      '<div class="np-head"><span>Notes on this page · ' +
      openCount +
      ' open total</span><button type="button" class="note-btn" data-act="close">×</button></div>' +
      '<div class="np-list"></div>' +
      '<div class="np-foot">' +
      '<button type="button" data-act="export">Save to file</button>' +
      '<button type="button" data-act="import">Load file</button>' +
      '<button type="button" data-act="copy">Copy JSON</button>' +
      '<button type="button" data-act="clear">Clear resolved</button></div>';
    panel.querySelector('[data-act="close"]').addEventListener('click', closePanel);
    panel.querySelector('[data-act="export"]').addEventListener('click', exportFile);
    panel.querySelector('[data-act="import"]').addEventListener('click', importFile);
    panel.querySelector('[data-act="copy"]').addEventListener('click', () => {
      navigator.clipboard.writeText(payload()).then(() => toast('Copied'));
    });
    panel.querySelector('[data-act="clear"]').addEventListener('click', () => {
      data.notes = data.notes.filter(n => n.status !== 'resolved');
      persist();
      renderPins();
      renderPanel();
    });
    const list = panel.querySelector('.np-list');
    const notes = pageNotes();
    if (!notes.length) {
      list.innerHTML = '<div class="np-item">No notes on this page yet.</div>';
      return;
    }
    notes.forEach((n, i) => {
      const item = document.createElement('div');
      item.className = 'np-item' + (n.status === 'resolved' ? ' resolved' : '');
      item.innerHTML =
        '<div class="np-where"></div><div class="np-text"></div>' +
        '<div class="np-actions">' +
        '<button type="button" data-act="jump">Jump</button>' +
        '<button type="button" data-act="edit">Edit</button>' +
        '<button type="button" data-act="resolve"></button>' +
        '<button type="button" data-act="delete">Delete</button></div>';
      item.querySelector('.np-where').textContent =
        '#' + (i + 1) + (n.target.anchor ? ' · §' + n.target.anchor : '') + ' · “' + n.target.snippet.slice(0, 46) + '…”';
      item.querySelector('.np-text').textContent = n.text + (n.resolution ? '\n↳ ' + n.resolution : '');
      item.querySelector('[data-act="resolve"]').textContent =
        n.status === 'resolved' ? 'Reopen' : 'Resolve';
      item.querySelector('[data-act="jump"]').addEventListener('click', () => {
        const el = resolveTarget(n.target);
        if (el) flash(el);
        else toast('Could not locate this block');
      });
      item.querySelector('[data-act="edit"]').addEventListener('click', () => {
        const el = resolveTarget(n.target);
        openDialog(el || document.body, n);
      });
      item.querySelector('[data-act="resolve"]').addEventListener('click', () => {
        n.status = n.status === 'resolved' ? 'open' : 'resolved';
        persist();
        renderPins();
        renderPanel();
      });
      item.querySelector('[data-act="delete"]').addEventListener('click', () => {
        data.notes = data.notes.filter(x => x.id !== n.id);
        persist();
        renderPins();
        renderPanel();
      });
      list.appendChild(item);
    });
  }

  /* ---------- export / import (supplementary/page-notes.json) ---------- */
  function payload() {
    return JSON.stringify({ updatedAt: new Date().toISOString(), notes: data.notes }, null, 2);
  }
  async function exportFile() {
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'page-notes.json',
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
        /* MERGE with what the file already holds instead of overwriting.
           Under file:// the browser gives every page its own private
           localStorage, so the notes file is the union of each page's
           island; saving from one page must never clobber another's notes.
           A "resolved" status already in the file wins over a stale local
           "open" (Claude marks notes resolved in the file). */
        const merged = {};
        try {
          const existing = JSON.parse(await (await handle.getFile()).text());
          (existing.notes || []).forEach(n => {
            merged[n.id] = n;
          });
        } catch (e) {
          /* New or non-JSON file: nothing to merge. */
        }
        data.notes.forEach(n => {
          const prev = merged[n.id];
          if (prev && prev.status === 'resolved' && n.status === 'open') return;
          merged[n.id] = n;
        });
        const out = JSON.stringify(
          { updatedAt: new Date().toISOString(), notes: Object.values(merged) },
          null,
          2,
        );
        const w = await handle.createWritable();
        await w.write(out);
        await w.close();
        toast('Merged into page-notes.json');
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload()], { type: 'application/json' }));
    a.download = 'page-notes.json';
    a.click();
    toast('Downloaded page-notes.json');
  }
  function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const d = JSON.parse(reader.result);
          if (!d || !Array.isArray(d.notes)) throw new Error('bad shape');
          /* MERGE rather than replace, so loading can never lose local notes
             that haven't been saved yet. The file wins for notes both sides
             know (that's how Claude's resolutions arrive); local-only notes
             (new, unsaved) survive. */
          const merged = {};
          data.notes.forEach(n => {
            merged[n.id] = n;
          });
          d.notes.forEach(n => {
            merged[n.id] = n;
          });
          data = { notes: Object.values(merged) };
          persist();
          renderPins();
          renderPanel();
          toast('Notes merged from file');
        } catch (e) {
          toast('Not a valid notes file');
        }
      };
      reader.readAsText(f);
    });
    input.click();
  }

  /* ---------- auto-sync from the notes ledger on page load ----------
     public/page-notes.json is APPEND-ONLY: notes are never deleted, only
     marked resolved (each carries a stable id). On load we fetch it and
     reconcile: a note resolved in the file stops showing here, and open
     notes from other pages/machines are imported. fetch() is unavailable
     under file:// (use the Load button there); on the dev server this makes
     resolution fully automatic. */
  async function syncFromFile() {
    try {
      const url = location.pathname.includes('/sections/')
        ? '../page-notes.json'
        : 'page-notes.json';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (!d || !Array.isArray(d.notes)) return;
      const fileById = {};
      d.notes.forEach(n => {
        fileById[n.id] = n;
      });
      let changed = false;
      data.notes.forEach(n => {
        const f = fileById[n.id];
        if (f && f.status === 'resolved' && n.status !== 'resolved') {
          n.status = 'resolved';
          if (f.resolution) n.resolution = f.resolution;
          changed = true;
        }
      });
      d.notes.forEach(n => {
        if (!data.notes.some(x => x.id === n.id)) {
          data.notes.push(n);
          changed = true;
        }
      });
      if (changed) {
        persist();
        renderPins();
        renderPanel();
      }
    } catch (e) {
      /* No server (file://) or no ledger yet: manual Load still works. */
    }
  }
  syncFromFile();

  /* Initial render, after fonts/layout settle. */
  renderPins();
  window.addEventListener('load', () => setTimeout(renderPins, 250));
})();
