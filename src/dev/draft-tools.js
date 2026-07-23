/* Dev-only tooling: the page-notes annotation layer and the slide-deck
   designation UI. Loaded ONLY under `astro dev` — GuidePage.astro renders the
   script tag behind import.meta.env.DEV, so this module never exists in
   `astro build` output (no marker-stripping involved; postbuild_relativize.py
   verifies nothing dev-flavoured reaches the build).

   Everything here talks to the dev server's /api/notes and /api/deck
   endpoints (astro.config.mjs), backed by the committed SQLite DB. The code
   is the former @dev-only block of assets/nav.js, moved verbatim. */
/* ------------------------------------------------------------------------
   Draft annotation layer - LOCAL DEV ONLY.

   The whole module (DRAFT badge, note mode, pins, panel, ledger auto-sync)
   activates only on the astro dev server. The built html-guide/ output is
   final: no badge, no annotation UI, and the ledger (page-notes.json) is
   stripped from it at build time (scripts/postbuild_relativize.py).

   "Add note" arms note mode: click any block (paragraph, diagram, code,
   table, callout...) and type a note. Notes render as numbered pins in the
   left gutter and, on the astro dev server, write straight through to the
   committed SQLite DB via /api/notes as you type, resolve, or delete them. If
   that endpoint isn't reachable (a plain static server, file://, an older
   checkout) it silently falls back to localStorage + the page-notes.json
   ledger. Keyboard: Escape exits note mode or closes the dialog. */
(function () {
  const IS_DEV =
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1') &&
    location.protocol.startsWith('http');
  if (!IS_DEV) return;
  const KEY = 'arg-notes-v1';
  const page = location.pathname.split('/').pop() || 'index.html';
  const BLOCKS =
    'figure.diagram, pre.code, table, .callout, .compare, .goal-card, li, p, h1, h2, h3, ' +
    'a.toc-row, #side-toc a, a.deck-link';

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
  /* A plain document note: a page annotation, not a deck-inclusion note (those
     carry a slideId/slideItemId) and not a deck-surface note. Only these show
     as pins and in the notes panel. */
  const isDocNote = n => n.surface !== 'deck' && !n.slideId && !n.slideItemId;
  const pageNotes = () => data.notes.filter(n => n.page === page && isDocNote(n));

  /* ---------- dev DB sync (/api/notes) ----------
     On the astro dev server every note write goes straight through to the
     committed SQLite DB (Prisma), and the page hydrates from it on load.
     localStorage stays as an optimistic cache. If the endpoint is unreachable
     (plain static server, file://, older checkout), apiUp flips to false and we
     fall back to the localStorage + page-notes.json flow below, so wiring this
     can never break annotating. */
  const API = '/api/notes';
  let apiUp = null; // null = not yet probed; true/false once known
  async function apiSend(method, query, body) {
    const res = await fetch(API + (query || ''), {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('api ' + res.status);
    return res.status === 204 ? null : res.json();
  }
  function pushNote(note) {
    /* Always attempt, and fail LOUDLY: the old silent apiUp latch once
       stranded notes in localStorage. syncFromApi() re-uploads local-only
       notes on the next page load, so nothing stays stranded. */
    apiSend('POST', '', note).then(
      () => {
        apiUp = true;
      },
      () => {
        apiUp = false;
        toast('Note save FAILED: kept locally, will re-sync on reload');
      },
    );
  }
  function deleteNoteRemote(id) {
    apiSend('DELETE', '?id=' + encodeURIComponent(id)).then(
      () => {
        apiUp = true;
      },
      () => {
        apiUp = false;
        toast('Note delete FAILED: not in the DB');
      },
    );
  }
  async function syncFromApi() {
    try {
      const d = await apiSend('GET', ''); // every note, all pages (panel is doc-wide)
      if (!d || !Array.isArray(d.notes)) throw new Error('shape');
      apiUp = true;
      /* The DB is the source of truth. Keep any local-only note not yet in the
         DB (e.g. one created while the endpoint was briefly unreachable). */
      const byId = {};
      d.notes.forEach(n => (byId[n.id] = n));
      data.notes.forEach(n => {
        if (!byId[n.id]) {
          byId[n.id] = n;
          /* Local-only note (created while the endpoint was down): upload it
             now so the DB — the store Claude reads — has it too. */
          pushNote(n);
        }
      });
      data = { notes: Object.values(byId) };
      persist();
      renderPins();
      renderPanel();
      return true;
    } catch (e) {
      apiUp = false;
      return false;
    }
  }

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
    '<button type="button" class="note-btn" data-act="arm">+ Add note</button>' +
    '<button type="button" class="note-btn" data-act="deckpanel"></button>' +
    '<button type="button" class="note-btn" data-act="deckmarks">Deck marks</button>' +
    '<button type="button" class="note-btn" data-act="deckarm">+ To deck</button>';
  document.body.appendChild(tools);
  const panelBtn = tools.querySelector('[data-act="panel"]');
  const armBtn = tools.querySelector('[data-act="arm"]');
  const deckBtn = tools.querySelector('[data-act="deckpanel"]');
  const deckMarksBtn = tools.querySelector('[data-act="deckmarks"]');
  const deckArmBtn = tools.querySelector('[data-act="deckarm"]');

  /* ---------- pins ---------- */
  const pinLayer = document.createElement('div');
  document.body.appendChild(pinLayer);
  /* 1-based number for each note, ranked by creation time across ALL pages but
     over the currently-unresolved notes only: #3 is the 3rd-oldest open note.
     Resolving a note renumbers the rest. */
  function numberMap() {
    const sorted = data.notes
      .filter(n => n.status !== 'resolved' && isDocNote(n))
      .sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
    const m = {};
    sorted.forEach((n, i) => (m[n.id] = i + 1));
    return m;
  }
  function updatePanelBtn() {
    const openAll = data.notes.filter(n => n.status !== 'resolved' && isDocNote(n)).length;
    const openHere = pageNotes().filter(n => n.status !== 'resolved').length;
    panelBtn.textContent = 'Notes ' + openAll + ' · ' + openHere + ' on page';
  }
  function renderPins() {
    pinLayer.textContent = '';
    const nums = numberMap();
    pageNotes().forEach(n => {
      if (n.status === 'resolved') return;
      const el = resolveTarget(n.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pin = document.createElement('div');
      pin.className = 'note-pin';
      pin.textContent = String(nums[n.id] || '?');
      pin.title = n.text || '(empty note)';
      /* Align the pin's centre to the vertical middle of the target's FIRST
         line (not the whole box), so it lines up with a heading or the top
         line of a paragraph, and sits just left of the content. */
      const PIN = 22;
      const cs = getComputedStyle(el);
      let lh = parseFloat(cs.lineHeight);
      if (!lh || Number.isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.4;
      const firstLineCenter = r.top + Math.min(lh, r.height) / 2;
      pin.style.top = window.scrollY + firstLineCenter - PIN / 2 + 'px';
      pin.style.left = Math.max(6, window.scrollX + r.left - PIN - 10) + 'px';
      pin.addEventListener('click', () => openDialog(el, n)); // click a pin to edit its note
      pinLayer.appendChild(pin);
    });
    updatePanelBtn();
  }
  let repositionTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(repositionTimer);
    repositionTimer = setTimeout(() => {
      renderPins();
      renderDeckDecorations();
    }, 150);
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
    if (!armed && !deckArmed) return;
    const sel = deckArmed ? '[data-content-id]' : BLOCKS;
    const block = e.target.closest && e.target.closest(sel);
    if (hovered && hovered !== block) hovered.classList.remove('note-hover-outline');
    hovered = block;
    if (block) block.classList.add('note-hover-outline');
  });
  document.addEventListener(
    'click',
    e => {
      if (!armed && !deckArmed) return;
      if (e.target.closest('.draft-tools, .notes-panel, .note-dialog, .note-pin, .deck-panel'))
        return;
      const sel = deckArmed ? '[data-content-id]' : BLOCKS;
      const block = e.target.closest(sel);
      if (!block) {
        /* Never navigate while a mode is armed: links without a selectable
           block just swallow the click. */
        if (e.target.closest('a')) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (deckArmed) {
        addBlockToDeck(block); // stay armed to add several blocks to the active slide
        if (hovered) {
          hovered.classList.remove('note-hover-outline');
          hovered = null;
        }
      } else {
        setArmed(false);
        openDialog(block);
      }
    },
    true,
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      setArmed(false);
      setDeckArmed(false);
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
      if (dialog._cleanup) dialog._cleanup();
      if (dialog._flush) dialog._flush();
      dialog.remove();
      dialog = null;
    }
  }
  function removeNote(note) {
    data.notes = data.notes.filter(x => x.id !== note.id);
    persist();
    deleteNoteRemote(note.id);
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
      pushNote(note); // save the moment it's created, before any typing
      renderPins();
    }
    dialog = document.createElement('div');
    dialog.className = 'note-dialog';
    dialog.innerHTML =
      '<div class="np-where" style="margin-bottom:6px;color:#8a5a00;font-size:11px"></div>' +
      '<textarea placeholder="What should change here? (autosaves as you type)"></textarea>' +
      '<div class="nd-actions">' +
      '<button type="button" class="note-btn danger" data-act="discard" style="margin-right:auto">Discard</button>' +
      '<button type="button" class="note-btn" data-act="cancel">Cancel</button>' +
      '<button type="button" class="note-btn active" data-act="done">Done</button></div>';
    dialog.querySelector('.np-where').textContent = '“' + note.target.snippet.slice(0, 70) + '…”';
    const ta = dialog.querySelector('textarea');
    ta.value = note.text;
    let autosaveTimer = null;
    function commit() {
      clearTimeout(autosaveTimer);
      note.text = ta.value.trim();
      persist();
      pushNote(note); // keep the backend copy current on every debounce/close
      renderPins();
      renderPanel();
    }
    ta.addEventListener('input', () => {
      clearTimeout(autosaveTimer);
      autosaveTimer = setTimeout(commit, 250);
    });
    /* Whatever closes the dialog (Done, Escape, another dialog opening): save
       the latest text, or delete the note outright if it was left empty. */
    dialog._flush = () => {
      clearTimeout(autosaveTimer);
      note.text = ta.value.trim();
      if (note.text) commit();
      else removeNote(note);
    };
    dialog.querySelector('[data-act="discard"]').addEventListener('click', () => {
      dialog._flush = null;
      removeNote(note);
      closeDialog();
      toast('Note discarded');
    });
    dialog.querySelector('[data-act="cancel"]').addEventListener('click', () => {
      closeDialog(); // just close; the latest text is kept (empty notes are cleaned up)
    });
    dialog.querySelector('[data-act="done"]').addEventListener('click', () => {
      const keep = ta.value.trim();
      closeDialog();
      if (keep) flash(block || document.body);
      else toast('Empty note discarded');
    });
    document.body.appendChild(dialog);
    ta.focus();
    /* Click anywhere outside the dialog closes it, same as Cancel. Attached on
       the next tick so the very click that opened the dialog doesn't close it. */
    const onOutside = e => {
      if (dialog && !e.target.closest('.note-dialog')) closeDialog();
    };
    setTimeout(() => document.addEventListener('mousedown', onOutside, true), 0);
    dialog._cleanup = () => document.removeEventListener('mousedown', onOutside, true);
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
  function pageLabel(p) {
    const m = /^(\d+)/.exec(p || '');
    return m ? '§' + parseInt(m[1], 10) : (p || '').replace(/\.html$/, '') || 'cover';
  }
  /* Relative href from the current page to another note's page. Section pages
     live under sections/; the cover is index.html at the root. */
  function pageHref(p) {
    const inSections = location.pathname.includes('/sections/');
    if (!p || p === 'index.html') return inSections ? '../index.html' : 'index.html';
    return inSections ? p : 'sections/' + p;
  }
  function renderPanel() {
    if (!panel) return;
    const nums = numberMap();
    /* Every unresolved note in the whole document, in global creation order.
       Resolved notes are never shown (you resolve them via Claude). */
    const open = data.notes
      .filter(n => n.status !== 'resolved' && isDocNote(n))
      .sort((a, b) => (nums[a.id] || 0) - (nums[b.id] || 0));
    panel.innerHTML =
      '<div class="np-head"><span>Unresolved notes · ' +
      open.length +
      ' across all pages</span><button type="button" class="note-btn" data-act="close">×</button></div>' +
      '<div class="np-list"></div>' +
      '<div class="np-foot"><button type="button" data-act="copy">Copy JSON</button></div>';
    panel.querySelector('[data-act="close"]').addEventListener('click', closePanel);
    panel.querySelector('[data-act="copy"]').addEventListener('click', () => {
      navigator.clipboard.writeText(payload()).then(() => toast('Copied'));
    });
    const list = panel.querySelector('.np-list');
    if (!open.length) {
      list.innerHTML = '<div class="np-item">No unresolved notes.</div>';
      return;
    }
    open.forEach(n => {
      const onThisPage = n.page === page;
      const item = document.createElement('div');
      item.className = 'np-item';
      item.style.cursor = 'pointer';
      item.innerHTML =
        '<div class="np-where"></div><div class="np-text"></div>' +
        '<div class="np-actions"><button type="button" data-act="delete">Delete</button></div>';
      item.querySelector('.np-where').textContent =
        '#' +
        (nums[n.id] || '?') +
        ' · ' +
        pageLabel(n.page) +
        ' · “' +
        ((n.target && n.target.snippet) || '').slice(0, 42) +
        '…”';
      item.querySelector('.np-text').textContent = n.text || '(empty)';
      /* Click the item to edit. On-page notes locate their block; off-page
         notes navigate to their page and open there (see openFromHash). */
      item.addEventListener('click', e => {
        if (e.target.closest('[data-act="delete"]')) return;
        if (onThisPage) {
          const el = resolveTarget(n.target);
          if (el) flash(el);
          openDialog(el || document.body, n);
        } else {
          location.href = pageHref(n.page) + '#note=' + encodeURIComponent(n.id);
        }
      });
      item.querySelector('[data-act="delete"]').addEventListener('click', e => {
        e.stopPropagation();
        removeNote(n);
      });
      list.appendChild(item);
    });
  }

  /* ---------- Copy JSON ---------- */
  function payload() {
    return JSON.stringify({ updatedAt: new Date().toISOString(), notes: data.notes }, null, 2);
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
  /* ==================== deck mode ====================
     Designate document blocks into slides: any block region carrying a stable
     data-content-id (paragraphs, headings, lists, tables, callouts, compares,
     goal cards, diagrams, snippets; stamped by src/lib/content-ids.mjs and the
     Diagram/Snippet components). The DB stores only references + arrangement;
     the content is pulled from the live doc when the deck renders. Dev-only. */
  const DECK_API = '/api/deck';
  let deck = { slides: [] };
  let deckArmed = false;
  /* "Deck marks": show the on-page deck highlights/badges. Off by default;
     persisted across pages. Arming deck mode always shows them. */
  let deckMarks = false;
  try {
    deckMarks = localStorage.getItem('arg-deck-marks') === '1';
  } catch (e) {}
  let activeSlideId = null;
  let deckApiUp = null;
  const deckLayer = document.createElement('div');
  document.body.appendChild(deckLayer);
  let deckPanel = null;

  function newId(p) {
    return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function currentPageSlug() {
    return (page || '').replace(/\.html$/, '');
  }
  /* ---- human-readable summaries for contentRefs (deck panel rows) ----
     Same-page refs read the live DOM; off-page refs lazily fetch + parse the
     served section page once and cache the Document. */
  const pageDocCache = {};
  function refMeta(ref) {
    const [slug, type, n] = ref.split('::');
    return { slug, type, n };
  }
  function lookupRef(doc, ref) {
    const esc = window.CSS && CSS.escape ? CSS.escape(ref) : ref;
    return doc.querySelector('[data-content-id="' + esc + '"]');
  }
  function summarizeEl(el) {
    if (!el) return null;
    let t = '';
    if (el.matches('figure.diagram')) {
      const cap = el.querySelector('figcaption');
      t = 'Diagram: ' + ((cap && cap.textContent) || '(no caption)').trim();
    } else if (el.classList.contains('snippet')) {
      const fn = el.querySelector('.filename');
      t = 'Code: ' + ((fn && fn.textContent) || el.textContent || '').trim();
    } else {
      t = (el.textContent || '').trim();
    }
    t = t.replace(/\s+/g, ' ');
    return t.length > 200 ? t.slice(0, 200) + '…' : t;
  }
  function refSummary(ref, cb) {
    const meta = refMeta(ref);
    if (meta.slug === currentPageSlug()) return cb(summarizeEl(lookupRef(document, ref)));
    if (meta.slug in pageDocCache) {
      const doc = pageDocCache[meta.slug];
      return cb(doc ? summarizeEl(lookupRef(doc, ref)) : null);
    }
    const href =
      (location.pathname.includes('/sections/') ? '' : 'sections/') + meta.slug + '.html';
    fetch(href, { cache: 'no-store' })
      .then(r => (r.ok ? r.text() : Promise.reject(new Error('' + r.status))))
      .then(html => {
        pageDocCache[meta.slug] = new DOMParser().parseFromString(html, 'text/html');
        cb(summarizeEl(lookupRef(pageDocCache[meta.slug], ref)));
      })
      .catch(() => {
        pageDocCache[meta.slug] = null;
        cb(null);
      });
  }
  async function deckSend(method, q, body) {
    const res = await fetch(DECK_API + (q || ''), {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('deck api ' + res.status);
    return res.status === 204 ? null : res.json();
  }
  async function deckLoad() {
    try {
      const d = await deckSend('GET', '');
      deck = { slides: (d && d.slides) || [] };
      deckApiUp = true;
    } catch (e) {
      deckApiUp = false;
      deck = { slides: [] };
    }
    if (!activeSlideId && deck.slides.length)
      activeSlideId = deck.slides[deck.slides.length - 1].id;
    renderDeckDecorations();
    renderDeckPanel();
    updateDeckBtn();
  }
  /* Saves always ATTEMPT the API (no permanent dead latch) and FAIL LOUDLY:
     a save that doesn't persist toasts, and flushDeckToApi() re-pushes the
     whole local arrangement the next time the mode is armed or the panel is
     opened after an outage (server upserts make that idempotent). */
  function saveSlideRemote(s) {
    return deckSend('POST', '/slide', {
      slide: {
        id: s.id,
        order: s.order,
        title: s.title || null,
        autoTitle: s.autoTitle !== false,
        layout: s.layout || 'free',
      },
    }).then(
      () => {
        deckApiUp = true;
      },
      () => {
        deckApiUp = false;
        toast('Deck save FAILED: not in the DB (re-arm deck mode to retry)');
      },
    );
  }
  function saveItemRemote(it) {
    return deckSend('POST', '/item', {
      item: {
        id: it.id,
        slideId: it.slideId,
        page: it.page,
        contentRef: it.contentRef,
        order: it.order,
        included: it.included !== false,
      },
    }).then(
      () => {
        deckApiUp = true;
      },
      () => {
        deckApiUp = false;
        toast('Deck save FAILED: not in the DB (re-arm deck mode to retry)');
      },
    );
  }
  async function flushDeckToApi() {
    try {
      await deckSend('GET', '');
      deckApiUp = true;
    } catch (e) {
      return; /* still unreachable; saves keep toasting */
    }
    for (const s of deck.slides) {
      await saveSlideRemote(s); /* slide before its items (FK order) */
      for (const it of s.items) await saveItemRemote(it);
    }
  }
  function addSlide() {
    const slide = {
      id: newId('s'),
      order: deck.slides.length,
      title: '',
      autoTitle: true,
      layout: 'free',
      items: [],
    };
    deck.slides.push(slide);
    activeSlideId = slide.id;
    saveSlideRemote(slide);
    renderDeckPanel();
    updateDeckBtn();
    return slide;
  }
  function addBlockToDeck(block) {
    const contentRef = block.getAttribute('data-content-id');
    if (!contentRef) {
      toast('Not a deck-able block');
      return;
    }
    let slide = deck.slides.find(s => s.id === activeSlideId);
    if (!slide) slide = addSlide();
    if (slide.items.some(it => it.contentRef === contentRef)) {
      toast('Already on this slide');
      return;
    }
    const item = {
      id: newId('i'),
      slideId: slide.id,
      page: contentRef.split('::')[0],
      contentRef,
      order: slide.items.length,
      included: true,
    };
    slide.items.push(item);
    saveItemRemote(item);
    flash(block);
    renderDeckDecorations();
    renderDeckPanel();
    updateDeckBtn();
    toast('Added to slide ' + (deck.slides.indexOf(slide) + 1));
  }
  function removeDeckItem(item) {
    const s = deck.slides.find(x => x.id === item.slideId);
    if (s) s.items = s.items.filter(x => x.id !== item.id);
    deckSend('DELETE', '/item?id=' + encodeURIComponent(item.id)).then(
      () => {
        deckApiUp = true;
      },
      () => {
        deckApiUp = false;
        toast('Deck delete FAILED: not in the DB');
      },
    );
    saveInclusionNote({ slideItemId: item.id }, ''); // drop its inclusion note too
    renderDeckDecorations();
    renderDeckPanel();
    updateDeckBtn();
  }
  function removeSlide(slide) {
    deck.slides = deck.slides.filter(s => s.id !== slide.id);
    if (activeSlideId === slide.id) activeSlideId = deck.slides.length ? deck.slides[0].id : null;
    deck.slides.forEach((s, i) => {
      if (s.order !== i) {
        s.order = i;
        saveSlideRemote(s);
      }
    });
    deckSend('DELETE', '/slide?id=' + encodeURIComponent(slide.id)).then(
      () => {
        deckApiUp = true;
      },
      () => {
        deckApiUp = false;
        toast('Deck delete FAILED: not in the DB');
      },
    );
    renderDeckDecorations();
    renderDeckPanel();
    updateDeckBtn();
  }
  function moveSlide(slide, dir) {
    const i = deck.slides.indexOf(slide);
    const j = i + dir;
    if (j < 0 || j >= deck.slides.length) return;
    deck.slides.splice(i, 1);
    deck.slides.splice(j, 0, slide);
    deck.slides.forEach((s, k) => {
      s.order = k;
      saveSlideRemote(s);
    });
    renderDeckPanel();
    renderDeckDecorations();
  }
  function moveItem(slide, item, dir) {
    const i = slide.items.indexOf(item);
    const j = i + dir;
    if (j < 0 || j >= slide.items.length) return;
    slide.items.splice(i, 1);
    slide.items.splice(j, 0, item);
    slide.items.forEach((it, k) => {
      it.order = k;
      saveItemRemote(it);
    });
    renderDeckPanel();
  }
  function reassignItem(item, newSlideId) {
    if (newSlideId === item.slideId) return;
    const from = deck.slides.find(s => s.id === item.slideId);
    const to = deck.slides.find(s => s.id === newSlideId);
    if (!to) return;
    if (from) from.items = from.items.filter(x => x.id !== item.id);
    item.slideId = newSlideId;
    item.order = to.items.length;
    to.items.push(item);
    saveItemRemote(item);
    renderDeckPanel();
    renderDeckDecorations();
    updateDeckBtn();
  }

  /* Inclusion notes ride the notes store (surface=doc + slideId/slideItemId),
     so isDocNote keeps them out of the page-notes pins and panel. */
  function inclusionNote(link) {
    return data.notes.find(n =>
      link.slideItemId
        ? n.slideItemId === link.slideItemId
        : n.slideId === link.slideId && !n.slideItemId,
    );
  }
  function saveInclusionNote(link, text) {
    text = (text || '').trim();
    let note = inclusionNote(link);
    if (!text) {
      if (note) {
        data.notes = data.notes.filter(x => x.id !== note.id);
        deleteNoteRemote(note.id);
      }
      return;
    }
    if (!note) {
      note = {
        id: newId('dn'),
        page: 'deck',
        surface: 'doc',
        status: 'open',
        text: '',
        target: {},
        slideId: link.slideId || undefined,
        slideItemId: link.slideItemId || undefined,
      };
      data.notes.push(note);
    }
    note.text = text;
    persist();
    pushNote(note);
  }

  function updateDeckBtn() {
    const items = deck.slides.reduce(
      (a, s) => a + s.items.filter(it => it.included !== false).length,
      0,
    );
    deckBtn.textContent = 'Deck ' + deck.slides.length + ' slides · ' + items + ' items';
  }
  function setDeckArmed(on) {
    deckArmed = on;
    document.body.classList.toggle('deck-mode', on);
    deckArmBtn.classList.toggle('active', on);
    if (on) {
      setArmed(false);
      if (deckApiUp === false) flushDeckToApi();
      if (!deckPanel) openDeckPanel();
      let s = deck.slides.find(x => x.id === activeSlideId);
      if (!s) s = deck.slides.length ? deck.slides[deck.slides.length - 1] : addSlide();
      activeSlideId = s.id;
      deckArmBtn.textContent = 'Click blocks → slide ' + (deck.slides.indexOf(s) + 1) + ' (Esc)';
    } else {
      deckArmBtn.textContent = '+ To deck';
      if (hovered) {
        hovered.classList.remove('note-hover-outline');
        hovered = null;
      }
    }
    renderDeckDecorations();
  }
  deckArmBtn.addEventListener('click', () => setDeckArmed(!deckArmed));
  function setDeckMarks(on) {
    deckMarks = on;
    try {
      localStorage.setItem('arg-deck-marks', on ? '1' : '0');
    } catch (e) {}
    deckMarksBtn.classList.toggle('active', on);
    renderDeckDecorations();
  }
  deckMarksBtn.classList.toggle('active', deckMarks);
  deckMarksBtn.addEventListener('click', () => setDeckMarks(!deckMarks));
  deckBtn.addEventListener('click', () => (deckPanel ? closeDeckPanel() : openDeckPanel()));

  function renderDeckDecorations() {
    deckLayer.textContent = '';
    document.querySelectorAll('.deck-included').forEach(el => el.classList.remove('deck-included'));
    if (!deckMarks && !deckArmed) return; /* doc stays clean by default */
    const slug = currentPageSlug();
    deck.slides.forEach((s, si) => {
      s.items.forEach(it => {
        if (it.contentRef.split('::')[0] !== slug) return;
        const ref = window.CSS && CSS.escape ? CSS.escape(it.contentRef) : it.contentRef;
        const el = document.querySelector('[data-content-id="' + ref + '"]');
        if (!el) return;
        el.classList.add('deck-included');
        const r = el.getBoundingClientRect();
        const box = document.createElement('div');
        box.className = 'deck-tagbox';
        box.style.top = window.scrollY + r.top + 6 + 'px';
        box.style.left = window.scrollX + r.right - 6 + 'px';
        const badge = document.createElement('div');
        badge.className = 'deck-badge' + (s.id === activeSlideId ? ' active' : '');
        badge.textContent = 'S' + (si + 1);
        badge.title = 'Slide ' + (si + 1) + (it.included === false ? ' · excluded' : '');
        badge.addEventListener('click', () => {
          activeSlideId = s.id;
          openDeckPanel();
        });
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'deck-badge-x';
        del.textContent = '×';
        del.title = 'Remove from slide ' + (si + 1);
        del.addEventListener('click', () => removeDeckItem(it));
        box.appendChild(badge);
        box.appendChild(del);
        deckLayer.appendChild(box);
      });
    });
  }

  function openDeckPanel() {
    if (deckApiUp === false) flushDeckToApi();
    if (!deckPanel) {
      deckPanel = document.createElement('div');
      deckPanel.className = 'deck-panel';
      document.body.appendChild(deckPanel);
    }
    renderDeckPanel();
  }
  function closeDeckPanel() {
    if (deckPanel) {
      deckPanel.remove();
      deckPanel = null;
    }
  }
  function debounced(fn, ms) {
    let t = null;
    return function (...a) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, a), ms || 300);
    };
  }
  function renderDeckPanel() {
    if (!deckPanel) return;
    const slug = currentPageSlug();
    const deckHref = location.pathname.includes('/sections/') ? '../deck' : 'deck';
    deckPanel.innerHTML =
      '<div class="np-head"><span>Deck · ' +
      deck.slides.length +
      ' slides</span><span><a class="dp-open" href="' +
      deckHref +
      '" target="_blank">Open deck ↗</a><button type="button" class="note-btn" data-act="close">×</button></span></div>' +
      '<div class="dp-list"></div>' +
      '<div class="np-foot"><button type="button" data-act="addslide">+ Slide</button>' +
      '<button type="button" data-act="copy">Copy JSON</button></div>';
    deckPanel.querySelector('[data-act="close"]').addEventListener('click', closeDeckPanel);
    deckPanel.querySelector('[data-act="addslide"]').addEventListener('click', () => addSlide());
    deckPanel.querySelector('[data-act="copy"]').addEventListener('click', () => {
      navigator.clipboard.writeText(JSON.stringify(deck, null, 2)).then(() => toast('Copied'));
    });
    const list = deckPanel.querySelector('.dp-list');
    if (!deck.slides.length) {
      list.innerHTML =
        '<div class="np-item">No slides yet. Use “+ To deck”, then click blocks.</div>';
      return;
    }
    const slideOpts = deck.slides
      .map((s, i) => '<option value="' + s.id + '">Slide ' + (i + 1) + '</option>')
      .join('');
    deck.slides.forEach((s, si) => {
      const box = document.createElement('div');
      box.className = 'dp-slide' + (s.id === activeSlideId ? ' active' : '');
      box.innerHTML =
        '<div class="dp-slide-head"><strong>Slide ' +
        (si + 1) +
        '</strong><span class="dp-actions">' +
        '<button type="button" data-a="up">↑</button><button type="button" data-a="down">↓</button>' +
        '<button type="button" data-a="active">' +
        (s.id === activeSlideId ? '● active' : 'set active') +
        '</button><button type="button" data-a="del">Delete</button></span></div>' +
        '<div class="dp-slide-controls">' +
        '<label class="dp-auto"><input type="checkbox" class="dp-autotitle" ' +
        (s.autoTitle !== false ? 'checked' : '') +
        '/>auto title</label>' +
        '<input class="dp-title" placeholder="Slide title" />' +
        '<select class="dp-layout">' +
        ['free', 'row', 'column', 'grid']
          .map(
            l =>
              '<option value="' +
              l +
              '"' +
              (s.layout === l ? ' selected' : '') +
              '>' +
              l +
              '</option>',
          )
          .join('') +
        '</select></div>' +
        '<textarea class="dp-slidenote" placeholder="Note for this slide (how it should look)"></textarea>' +
        '<div class="dp-items"></div>';
      const titleInput = box.querySelector('.dp-title');
      const autoCb = box.querySelector('.dp-autotitle');
      const syncTitleEnabled = () => {
        const auto = s.autoTitle !== false;
        titleInput.disabled = auto;
        titleInput.placeholder = auto ? 'Auto — Claude titles this slide' : 'Slide title';
      };
      titleInput.value = s.title || '';
      syncTitleEnabled();
      titleInput.addEventListener(
        'input',
        debounced(e => {
          s.title = e.target.value;
          saveSlideRemote(s);
        }),
      );
      autoCb.addEventListener('change', e => {
        s.autoTitle = e.target.checked;
        syncTitleEnabled();
        saveSlideRemote(s);
      });
      box.querySelector('.dp-layout').addEventListener('change', e => {
        s.layout = e.target.value;
        saveSlideRemote(s);
      });
      const sn = box.querySelector('.dp-slidenote');
      const snote = inclusionNote({ slideId: s.id });
      sn.value = snote ? snote.text : '';
      sn.addEventListener(
        'input',
        debounced(e => saveInclusionNote({ slideId: s.id }, e.target.value)),
      );
      box.querySelector('[data-a="up"]').addEventListener('click', () => moveSlide(s, -1));
      box.querySelector('[data-a="down"]').addEventListener('click', () => moveSlide(s, 1));
      box.querySelector('[data-a="active"]').addEventListener('click', () => {
        activeSlideId = s.id;
        renderDeckPanel();
        renderDeckDecorations();
      });
      box.querySelector('[data-a="del"]').addEventListener('click', () => removeSlide(s));
      const items = box.querySelector('.dp-items');
      if (!s.items.length) items.innerHTML = '<div class="dp-empty">No items yet.</div>';
      s.items.forEach(it => {
        const row = document.createElement('div');
        row.className =
          'dp-item' +
          (it.included === false ? ' excluded' : '') +
          (it.page === slug ? '' : ' offpage');
        row.innerHTML =
          '<label class="dp-inc"><input type="checkbox" ' +
          (it.included !== false ? 'checked' : '') +
          '/></label><span class="dp-ref"><span class="dp-meta"></span><span class="dp-summary">…</span></span>' +
          '<span class="dp-actions"><button type="button" data-a="up">↑</button>' +
          '<button type="button" data-a="down">↓</button><select class="dp-move">' +
          slideOpts +
          '</select><button type="button" data-a="rm">✕</button></span>' +
          '<textarea class="dp-itemnote" placeholder="Note for this block"></textarea>';
        const meta = refMeta(it.contentRef);
        const chap = (meta.slug.match(/^(\d+)/) || [])[1];
        row.querySelector('.dp-meta').textContent =
          (chap ? '§' + Number(chap) + ' · ' : meta.slug + ' · ') + meta.type + ' ' + meta.n;
        row.querySelector('.dp-ref').title = it.contentRef;
        const sumEl = row.querySelector('.dp-summary');
        if (it.altText) {
          /* Claude-condensed override: show what the slide will actually say. */
          row.querySelector('.dp-meta').textContent += ' · ✎ condensed';
          const tmp = document.createElement('div');
          tmp.innerHTML = it.altText;
          sumEl.textContent = (tmp.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200);
        } else {
          refSummary(it.contentRef, t => {
            sumEl.textContent = t || it.contentRef;
          });
        }
        row.querySelector('.dp-inc input').addEventListener('change', e => {
          it.included = e.target.checked;
          saveItemRemote(it);
          renderDeckDecorations();
          updateDeckBtn();
        });
        row.querySelector('[data-a="up"]').addEventListener('click', () => moveItem(s, it, -1));
        row.querySelector('[data-a="down"]').addEventListener('click', () => moveItem(s, it, 1));
        const mv = row.querySelector('.dp-move');
        mv.value = it.slideId;
        mv.addEventListener('change', e => reassignItem(it, e.target.value));
        row.querySelector('[data-a="rm"]').addEventListener('click', () => removeDeckItem(it));
        const inb = row.querySelector('.dp-itemnote');
        const inote = inclusionNote({ slideItemId: it.id });
        inb.value = inote ? inote.text : '';
        inb.addEventListener(
          'input',
          debounced(e => saveInclusionNote({ slideItemId: it.id }, e.target.value)),
        );
        items.appendChild(row);
      });
      list.appendChild(box);
    });
  }

  /* Arriving via a panel "jump" from another page: open that note's editor and
     scroll to its block once the page has hydrated. The hash is cleared so a
     later manual refresh doesn't reopen it. */
  function openFromHash() {
    const m = /#note=([^&]+)/.exec(location.hash);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    const note = data.notes.find(x => x.id === id);
    if (!note) return;
    history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => {
      const el = resolveTarget(note.target);
      if (el) flash(el);
      openDialog(el || document.body, note);
    }, 300);
  }

  /* Hydrate from the dev DB; fall back to the page-notes.json ledger if the
     endpoint isn't there. Then honour a jump-to-note hash, if any. */
  syncFromApi().then(ok => {
    if (!ok) syncFromFile();
    openFromHash();
    deckLoad(); // hydrate the deck after notes (inclusion notes live in the notes store)
  });

  /* Initial render, after fonts/layout settle. */
  renderPins();
  window.addEventListener('load', () =>
    setTimeout(() => {
      renderPins();
      renderDeckDecorations();
    }, 250),
  );
})();
