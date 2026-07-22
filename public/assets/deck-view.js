/* Slide-deck presentation renderer. Reused in two contexts:
   - dev: on the /deck route, reads live data from /api/deck and pulls each
     referenced block out of the served section pages (source of truth = the
     doc, resolved at view time);
   - distributable: the build generator inlines window.__DECK__ (slides+items)
     and window.__BLOCKS__ (contentRef -> outerHTML), so this runs offline.
   The content is never stored in the DB; it is always the document's. */
(function () {
  let cur = 0;
  let overview = null;

  function slidesEls() {
    return Array.prototype.slice.call(document.querySelectorAll('.slide'));
  }

  async function getDeck() {
    if (window.__DECK__) return window.__DECK__;
    try {
      const r = await fetch('/api/deck', { cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch (e) {}
    return { slides: [] };
  }

  async function getBlocks(deck) {
    if (window.__BLOCKS__) return window.__BLOCKS__;
    // Dev: fetch each referenced section page once and extract its blocks.
    const slugs = {};
    (deck.slides || []).forEach(s =>
      (s.items || []).forEach(it => {
        slugs[String(it.contentRef).split('::')[0]] = true;
      }),
    );
    const map = {};
    for (const slug of Object.keys(slugs)) {
      let html = null;
      for (const url of ['sections/' + slug, 'sections/' + slug + '.html']) {
        try {
          const r = await fetch(url, { cache: 'no-store' });
          if (r.ok) {
            html = await r.text();
            break;
          }
        } catch (e) {}
      }
      if (!html) continue;
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('[data-content-id]').forEach(el => {
        map[el.getAttribute('data-content-id')] = el.outerHTML;
      });
    }
    return map;
  }

  function render(deck, blocks) {
    const root = document.getElementById('deck-root');
    root.innerHTML = '';
    const slides = (deck.slides || []).slice().sort((a, b) => a.order - b.order);
    if (!slides.length) {
      root.innerHTML =
        '<div class="deck-empty">No slides yet. In the guide, use “+ To deck”, ' +
        'click blocks onto slides, then reload this page.</div>';
      updateHud();
      return;
    }
    slides.forEach((s, i) => {
      const sec = document.createElement('section');
      sec.className = 'slide' + (i === 0 ? ' current' : '');
      const canvas = document.createElement('div');
      canvas.className = 'slide-canvas';
      if (s.title) {
        const h = document.createElement('div');
        h.className = 'slide-title';
        h.textContent = s.title;
        canvas.appendChild(h);
      }
      const body = document.createElement('div');
      body.className = 'slide-body layout-' + (s.layout || 'free');
      (s.items || [])
        .filter(it => it.included !== false)
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach(it => {
          const cell = document.createElement('div');
          cell.className = 'slide-item';
          cell.innerHTML =
            blocks[it.contentRef] ||
            '<div class="deck-missing">missing: ' + it.contentRef + '</div>';
          body.appendChild(cell);
        });
      canvas.appendChild(body);
      sec.appendChild(canvas);
      root.appendChild(sec);
    });
    cur = 0;
    show(0);
    buildOverviewData(slides);
  }

  function show(i) {
    const els = slidesEls();
    if (!els.length) return;
    cur = Math.max(0, Math.min(i, els.length - 1));
    els.forEach((e, k) => e.classList.toggle('current', k === cur));
    fit();
    updateHud();
  }
  function fit() {
    const els = slidesEls();
    const c = els[cur] && els[cur].querySelector('.slide-canvas');
    if (!c) return;
    const scale = Math.min((window.innerWidth * 0.94) / 1280, (window.innerHeight * 0.9) / 720);
    c.style.transform = 'scale(' + scale + ')';
  }
  function updateHud() {
    const el = document.getElementById('deck-counter');
    if (el) el.textContent = slidesEls().length ? cur + 1 + ' / ' + slidesEls().length : '0 / 0';
  }

  let overviewData = [];
  function buildOverviewData(slides) {
    overviewData = slides.map(s => ({
      title: s.title || '',
      refs: (s.items || []).map(it => it.contentRef).join('\n'),
    }));
  }
  function toggleOverview() {
    if (overview) {
      overview.remove();
      overview = null;
      return;
    }
    overview = document.createElement('div');
    overview.className = 'deck-overview';
    overviewData.forEach((d, i) => {
      const card = document.createElement('div');
      card.className = 'ov-slide';
      card.innerHTML =
        '<div class="ov-num">Slide ' +
        (i + 1) +
        '</div><div class="ov-title"></div><div class="ov-refs"></div>';
      card.querySelector('.ov-title').textContent = d.title || '(untitled)';
      card.querySelector('.ov-refs').textContent = d.refs;
      card.addEventListener('click', () => {
        toggleOverview();
        show(i);
      });
      overview.appendChild(card);
    });
    document.body.appendChild(overview);
  }

  function buildHud() {
    const hud = document.getElementById('deck-hud');
    if (!hud) return;
    hud.innerHTML =
      '<button data-a="prev" title="Previous (←)">‹</button>' +
      '<span id="deck-counter">0 / 0</span>' +
      '<button data-a="next" title="Next (→)">›</button>' +
      '<button data-a="ov" title="Overview (o)">Overview</button>' +
      '<button data-a="fs" title="Fullscreen (f)">⤢</button>';
    hud.querySelector('[data-a="prev"]').addEventListener('click', () => show(cur - 1));
    hud.querySelector('[data-a="next"]').addEventListener('click', () => show(cur + 1));
    hud.querySelector('[data-a="ov"]').addEventListener('click', toggleOverview);
    hud.querySelector('[data-a="fs"]').addEventListener('click', goFullscreen);
  }
  function goFullscreen() {
    const d = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (d.requestFullscreen) d.requestFullscreen();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      show(cur + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      show(cur - 1);
    } else if (e.key === 'Home') {
      show(0);
    } else if (e.key === 'End') {
      show(slidesEls().length - 1);
    } else if (e.key === 'f') {
      goFullscreen();
    } else if (e.key === 'o' || e.key === 'Escape') {
      toggleOverview();
    }
  });
  window.addEventListener('resize', fit);

  (async function () {
    buildHud();
    const deck = await getDeck();
    const blocks = await getBlocks(deck);
    render(deck, blocks);
  })();
})();
