# OPTIONAL regeneration utility for the standalone deck (slide-deck/*.html).
# The HTML files are the deliverable and are freely hand-editable; this script
# just rebuilds them from the slide spec below if you want to re-pull diagrams
# after the guide changes. Run from the repo root:
#     python3 slide-deck/_generate.py
# It reads the BUILT guide (npm run build first) and overwrites slide-deck/*.html.
# It deliberately has no hook into the app, the dev tooling, or npm scripts.
import re, os, html

SITE = 'build/output/app-router-guide_html/sections'
OUT = 'slide-deck'

def extract_svg(ref):
    slug = ref.split('::')[0]
    src = open(f'{SITE}/{slug}.html', encoding='utf-8').read()
    m = re.search(r'<figure\b[^>]*\bdata-content-id="' + re.escape(ref) + r'"[^>]*>', src)
    assert m, ref
    seg = src[m.end():]
    sm = re.search(r'<svg\b', seg)
    depth, pos = 0, sm.start()
    for mm in re.finditer(r'<(/?)svg\b', seg[pos:]):
        depth += -1 if mm.group(1) else 1
        if depth == 0:
            end = pos + mm.start()
            end = seg.index('>', end) + 1
            return seg[pos:end]
    raise AssertionError('unbalanced svg ' + ref)

S = [  # (file, part-kicker, kicker-class, title, bullets, diagram-ref-or-None)
 ('01-why-this-exists', 'Introduction', 'kz', 'Why this guide exists', [
   'Stitched from the official Next.js 16 + React 19 docs: reorganized, expanded, made concrete',
   'Plus the patterns the docs never quite name, the ones you only learn by shipping against the App Router',
   '<strong>The one ask: read the docs.</strong> As a description of a model, not as an API reference when something breaks',
   'This deck is the summary; the guide has the detail; the docs are the territory'], None),
 ('02-the-stakes', 'Introduction', 'kz', 'The stakes', [
   'Architecture compounds: <strong>every new page copies the page before it</strong>',
   'Conventions harden in months; unwinding them takes years',
   '<strong>Server-first is not a preference.</strong> It is the operating assumption of React 19 and the App Router',
   'Build against the grain and nothing throws; it all just quietly works worse'], None),
 ('03-direction-of-travel', 'Introduction', 'kz', 'The direction of travel', [
   '2013&ndash;2018: the client era built machinery for surviving in the browser',
   '2020&ndash;2025: RSC, React 18/19, Next 13&rarr;16 moved the work back to the server',
   'Betting against this direction means fighting both React and Vercel'],
   '01-introduction::diagram::1'),
 ('04-the-thesis', 'The Goals', 'kz', 'Separate the known from the unknown', [
   'On every page: <strong>what can be known at first render, and what cannot?</strong>',
   'A: Maximize the known &middot; B: Contain the unknown &middot; C: Decouple the parts',
   'Structure and containers are known: they render immediately and reserve space'],
   '02-goals::diagram::1'),
 ('05-rendering-model', 'The Mental Model', 'kz', 'Same page, two architectures', [
   'The SPA chain serializes five steps, with a spinner at each',
   'Server-first: one render, streamed; the browser paints content, not scaffolding',
   'The app directory is your app&rsquo;s scaffold, not just its routes'],
   '03-mental-model::diagram::2'),
 ('06-the-spinner-tower', 'Part A: Maximize the Known', 'ka', 'The spinner tower', [
   'Client-side, every DOM layer is blocked by the request above it',
   'Server-side, the waiting happens where the data lives',
   'Streaming paints the shell first; content replaces placeholders as it resolves'],
   '04-ssr::diagram::1'),
 ('07-boundaries', 'Part A: Maximize the Known', 'ka', 'Push interactivity to the leaves', [
   '<code>"use client"</code> marks where the server hands off, not which component is interactive',
   'One directive at the top converts the whole tree; at the leaves it costs almost nothing',
   'Server components pass through the boundary as <code>children</code>'],
   '05-client-server-boundaries::diagram::4'),
 ('08-bundle-size', 'Part A: Maximize the Known', 'ka', 'Wholesale components fuse the known to the unknown', [
   'A wholesale grid makes the entire table region one blocked client chunk',
   'Compose instead: the server renders the frame; the client owns only the interactive cells',
   'Heavy dependencies load on demand, behind light fallbacks'],
   '08-bundle-size-code-splitting::diagram::1'),
 ('09-url-state', 'Part A: Maximize the Known', 'ka', 'The URL is the state manager', [
   'One URL is a complete, serialized description of the view',
   'Filters, tabs, sort, page: <strong>the view lives in the URL</strong>; cookies describe the viewer',
   'Writing the URL is how a client leaf asks the server to re-render'],
   '09-server-resolvable-state::diagram::1'),
 ('10-containers', 'Part B: Contain the Unknown', 'kb', 'Containers reserve space', [
   'Late-arriving content must land inside a frame that never moves',
   'Skeletons belong to boundaries, never to components',
   'Comps are happy paths: design the loading, empty, and error states too'],
   '10-containers-content-shifting::diagram::1'),
 ('11-suspense-streaming', 'Part B: Contain the Unknown', 'kb', 'Suspense &amp; streaming', [
   'A boundary declares: below this point may not be ready; here is what to show instead',
   'Same fetches, same durations: streaming changes <em>when</em> things paint, not how long they take',
   '<code>loading.tsx</code> and <code>error.tsx</code> are boundaries Next.js wraps around your page'],
   '11-suspense-streaming::diagram::3'),
 ('12-blocking', 'Part B: Contain the Unknown', 'kb', 'Blocking is positional', [
   'The same three reads, chained on the client: latency stacks',
   'An <code>await</code> at the page level gates everything behind the slowest read',
   'Structure decides parallelism: siblings fetch in parallel without anyone writing &ldquo;parallel&rdquo;'],
   '14-blocking-requests::diagram::6'),
 ('13-signs-wrong', 'Part D: Applied', 'kd', 'Signs you&rsquo;re doing it wrong', [
   'The client component is the <strong>bottom of the ladder</strong>, reached only after the server can&rsquo;t',
   'Fetch-in-useEffect, spinners inside spinners, effects mirroring props into state: smells with names',
   'The full checklist is &sect;18; the before/after from Tracker is &sect;19. <strong>Read the docs.</strong>'],
   '18-signs-doing-it-wrong::diagram::1'),
]

NAV_JS = """<script>
  (function () {
    var prev = document.querySelector('[data-nav=prev]');
    var next = document.querySelector('[data-nav=next]');
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && prev) location.href = prev.getAttribute('href');
      if ((e.key === 'ArrowRight' || e.key === ' ') && next) {
        e.preventDefault();
        location.href = next.getAttribute('href');
      }
      if (e.key === 'Home') location.href = 'index.html';
    });
  })();
</script>"""

def page(title, body, cover=False):
    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="icon" href="assets/logomark.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="assets/guide.css" />
    <link rel="stylesheet" href="assets/slides.css" />
  </head>
  <body class="{'deck-cover' if cover else 'deck-slide'}">
{body}
{NAV_JS}
  </body>
</html>
"""

n = len(S)
for i, (f, kick, kcls, title, bullets, ref) in enumerate(S):
    prevf = S[i-1][0] + '.html' if i > 0 else 'index.html'
    nextf = S[i+1][0] + '.html' if i + 1 < n else None
    fig = f'\n      <div class="fig">{extract_svg(ref)}</div>' if ref else ''
    lis = '\n'.join(f'        <li>{b}</li>' for b in bullets)
    nav_next = f'<a data-nav="next" class="nv" href="{nextf}">&rsaquo;</a>' if nextf else '<span class="nv off">&rsaquo;</span>'
    body = f"""    <main class="slide{' no-fig' if not ref else ''}">
      <div class="kicker {kcls}">{kick}</div>
      <h1>{title}</h1>
      <ul class="points">
{lis}
      </ul>{fig}
    </main>
    <nav class="deck-nav">
      <a class="home" href="index.html" title="Contents">&#8962;</a>
      <a data-nav="prev" class="nv" href="{prevf}">&lsaquo;</a>
      <span class="ct">{i + 1} / {n}</span>
      {nav_next}
    </nav>"""
    open(f'{OUT}/{f}.html', 'w', encoding='utf-8').write(page(f'{i+1}. {re.sub("<[^>]+>", "", title)} - App Router Guide deck', body))

agenda = '\n'.join(
    f'        <a class="ag" href="{f}.html"><span class="n">{i+1}</span><span class="t">{re.sub("<[^>]+>", "", t)}</span></a>'
    for i, (f, k, kc, t, b, r) in enumerate(S))
cover_body = f"""    <main class="cover">
      <img class="mark" src="assets/logomark.svg" alt="Craft Education" />
      <div class="kicker kz">Craft Education &middot; Engineering</div>
      <h1>The App Router Guide</h1>
      <p class="sub">
        Server-first Next.js 16 / React 19: what we optimize for on every page, and the patterns
        that get us there. The short version; the guide has the detail.
      </p>
      <div class="agenda">
{agenda}
      </div>
      <a class="start" data-nav="next" href="{S[0][0]}.html">Start &rsaquo;</a>
    </main>"""
open(f'{OUT}/index.html', 'w', encoding='utf-8').write(page('The App Router Guide - deck', cover_body, cover=True))
print('wrote', n + 1, 'pages')
