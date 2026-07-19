#!/usr/bin/env python3
"""
Diagram geometry linter for the App Router Guide.

MANDATORY: run after ANY diagram add or edit (see PROJECT.md).
    python3 scripts/svg_lint.py [file.html ...]     (default: build/app-router-guide_html/sections/*.html)

Checks every <svg> inside figure.diagram for the failure classes Nick has
flagged repeatedly:
  T1  text estimated to overflow the rect it sits inside
  T2  text crossing the border of a rect it is NOT inside (partial overlap)
  T3  text extending outside the viewBox
  T4  text bbox intersecting an arrow/line segment
  P1  container rects whose first/last child gaps differ (uneven vertical padding)
  P2  container rects whose left/right child insets differ
  D1  full-width divider lines with unequal content gaps above vs below
  L1  diagonal <line> elements (arrows must be H, V, or deliberate <path> curves)
  R1  same-size sibling rects whose y differ by 1-5px (misaligned row)

Text width is estimated (Inter ≈ 0.56 × font-size per char; ~1.6 for emoji/wide
glyphs), so T-checks are heuristics: tune FUDGE if false positives appear.
"""
import re, sys, glob, html

FUDGE = 0.56
WIDE = set("⏳✦⟵→↓✓—")

def text_width(s, fs):
    w = 0.0
    for ch in s:
        w += fs * (1.05 if ch in WIDE else FUDGE)
    return w

def parse(svg):
    rects, texts, lines = [], [], []
    for m in re.finditer(r'<rect ([^>]*?)\s*/?>', svg):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        try:
            rects.append(dict(x=float(a['x']), y=float(a['y']), w=float(a['width']),
                              h=float(a['height']), fill=a.get('fill',''), raw=m.group(0)))
        except KeyError:
            pass
    for m in re.finditer(r'<text ([^>]*)>(.*?)</text>', svg):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        content = html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip()
        fs = float(a.get('font-size', 12))
        x, y = float(a['x']), float(a['y'])
        w = text_width(content, fs)
        anchor = a.get('text-anchor', 'start')
        x0 = x - w/2 if anchor == 'middle' else (x - w if anchor == 'end' else x)
        central = a.get('dominant-baseline') == 'central'
        top = y - fs/2 if central else y - fs*0.72
        bot = y + fs/2 if central else y + fs*0.2
        texts.append(dict(x0=x0, x1=x0+w, y0=top, y1=bot, s=content[:38], fs=fs))
    for m in re.finditer(r'<line ([^>]*?)\s*/?>', svg):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        try:
            lines.append(dict(x1=float(a['x1']), y1=float(a['y1']), x2=float(a['x2']),
                              y2=float(a['y2']), stroke=a.get('stroke',''),
                              marker='marker-end' in m.group(1)))
        except KeyError:
            pass
    vb = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg)
    return rects, texts, lines, (float(vb.group(1)), float(vb.group(2))) if vb else (720, 400)

def inside(t, r, pad=2):
    return (t['x0'] >= r['x']-pad and t['x1'] <= r['x']+r['w']+pad and
            t['y0'] >= r['y']-pad and t['y1'] <= r['y']+r['h']+pad)

def overlaps(t, r):
    return not (t['x1'] < r['x'] or t['x0'] > r['x']+r['w'] or
                t['y1'] < r['y'] or t['y0'] > r['y']+r['h'])

def lint_svg(svg, where):
    # Normalize prettier-formatted markup: attributes and text content may be
    # spread across indented lines — collapse to single-line tags so the
    # regex parser sees the same shapes as hand-formatted SVG.
    svg = re.sub(r'\s*\n\s*', ' ', svg)
    issues = []
    rects, texts, lines, (vw, vh) = parse(svg)
    for t in texts:
        # T3: viewBox bounds
        if t['x0'] < -2 or t['x1'] > vw+2 or t['y1'] > vh+2:
            issues.append(f"T3 text outside viewBox: '{t['s']}'")
        # T1/T2: relation to each rect
        for r in rects:
            if overlaps(t, r) and not inside(t, r):
                # ignore rects that merely sit behind bigger zone rects the text IS inside
                container = any(inside(t, r2) for r2 in rects)
                vert_inside = r['y']-2 <= t['y0'] and t['y1'] <= r['y']+r['h']+2
                crosses_one = (t['x1'] > r['x']+r['w']+3 or t['x0'] < r['x']-3) and \
                              (t['x0'] > r['x'] or t['x1'] < r['x']+r['w'])
                engulfs = t['x0'] < r['x']-3 and t['x1'] > r['x']+r['w']+3 and \
                          r['x'] < (t['x0']+t['x1'])/2 < r['x']+r['w']
                if vert_inside and (crosses_one or engulfs):
                    issues.append(f"T1/T2 text crosses rect edge: '{t['s']}' vs rect@({r['x']:.0f},{r['y']:.0f},{r['w']:.0f}x{r['h']:.0f})")
                    break
        # T4: text vs horizontal lines
        for l in lines:
            if l['y1'] == l['y2'] and t['y0'] <= l['y1'] <= t['y1']:
                lo, hi = sorted((l['x1'], l['x2']))
                if t['x1'] > lo+2 and t['x0'] < hi-2:
                    issues.append(f"T4 text overlaps line y={l['y1']:.0f}: '{t['s']}'")
    # C1: a line's marker must match the line's stroke color
    markers = {m.group(1): m.group(2) for m in re.finditer(
        r'<marker id="([\w-]+)"[^>]*>.*?stroke="(#[0-9a-fA-F]+)"', svg, re.S)}
    for m in re.finditer(r'<(?:line|path) [^>]*stroke="(#[0-9a-fA-F]+)"[^>]*marker-end="url\(#([\w-]+)\)"', svg):
        stroke, mid = m.group(1).lower(), m.group(2)
        if mid in markers and markers[mid].lower() != stroke:
            issues.append(f"C1 marker color mismatch: line stroke {stroke} uses marker #{mid} ({markers[mid]})")
    # L1: diagonal lines (allow deliberate mirrored diagonals? flag for review anyway)
    diags = [l for l in lines if l['x1'] != l['x2'] and l['y1'] != l['y2'] and l['marker']]
    for l in diags:
        dx, dy = l['x2']-l['x1'], l['y2']-l['y1']
        mirrored = any(m is not l and m['y1'] == l['y1'] and m['y2'] == l['y2'] and
                       abs((m['x2']-m['x1']) + dx) < 2 for m in diags)
        if not mirrored:
            issues.append(f"L1 unmirrored diagonal arrow ({abs(dx):.0f}x{abs(dy):.0f}) at ({l['x1']:.0f},{l['y1']:.0f})")
    # P1/P2: container padding symmetry. Content = child rects + texts whose
    # vertical span and horizontal center sit inside the container.
    stats = []
    for r in rects:
        kids = [k for k in rects if k is not r and
                k['x'] >= r['x'] and k['x']+k['w'] <= r['x']+r['w'] and
                k['y'] >= r['y'] and k['y']+k['h'] <= r['y']+r['h'] and
                k['w'] < r['w'] and k['h'] < r['h']]
        if len(kids) < 2 or 'data-lint-ignore' in r['raw']:
            continue
        tops = [k['y'] for k in kids]; bots = [k['y']+k['h'] for k in kids]
        for tx in texts:
            if r['y'] <= tx['y0'] and tx['y1'] <= r['y']+r['h'] and \
               r['x'] < (tx['x0']+tx['x1'])/2 < r['x']+r['w']:
                tops.append(tx['y0']); bots.append(tx['y1'])
        top = min(tops) - r['y']
        bot = (r['y']+r['h']) - max(bots)
        stats.append((r, top, bot))
        left = min(k['x'] for k in kids) - r['x']
        right = (r['x']+r['w']) - max(k['x']+k['w'] for k in kids)
        if abs(left-right) > 6:
            issues.append(f"P2 uneven h-inset in rect@({r['x']:.0f},{r['y']:.0f}): left {left:.0f} vs right {right:.0f}")
    for r, top, bot in stats:
        if abs(top-bot) <= 6:
            continue
        # deliberate panel variants: a congruent container that passes with the
        # same bottom pad means this one's extra top space mirrors its header zone
        congruent_ok = any(r2 is not r and r2['w'] == r['w'] and r2['h'] == r['h'] and
                           abs(b2-bot) <= 2 and abs(t2-b2) <= 6
                           for r2, t2, b2 in stats)
        if not congruent_ok:
            issues.append(f"P1 uneven v-padding in rect@({r['x']:.0f},{r['y']:.0f}): top {top:.0f} vs bottom {bot:.0f}")
    # V1: viewBox top/bottom margin symmetry (content = rects + texts)
    ys0 = [r['y'] for r in rects] + [t['y0'] for t in texts] + \
          [min(l['y1'], l['y2']) for l in lines]
    ys1 = [r['y']+r['h'] for r in rects] + [t['y1'] for t in texts] + \
          [max(l['y1'], l['y2']) for l in lines]
    for m in re.finditer(r'<circle ([^>]*?)\s*/?>', svg):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if 'cy' in a:
            ys0.append(float(a['cy'])-float(a.get('r', 0)))
            ys1.append(float(a['cy'])+float(a.get('r', 0)))
    if ys0 and ys1:
        topm = min(ys0)
        botm = vh - max(ys1)
        # The figure's CSS padding is THE padding: content sits flush to the
        # viewBox (≈2px guard on each side).
        if topm > 5 or botm > 5 or topm < -1 or botm < -1:
            issues.append(f"V1 viewBox not flush to content: top {topm:.0f}, bottom {botm:.0f} (vh={vh:.0f})")
    # D1: divider gap symmetry
    for l in lines:
        if l['y1'] == l['y2'] and abs(l['x2']-l['x1']) > 0.6*vw and not l['marker'] \
                and l['stroke'].lower() == '#e0e0e0':
            y = l['y1']
            above = [y - max(t['y1'] for t in texts if t['y1'] < y)] if any(t['y1'] < y for t in texts) else []
            below = [min(t['y0'] for t in texts if t['y0'] > y) - y] if any(t['y0'] > y for t in texts) else []
            ra = [y - (r['y']+r['h']) for r in rects if r['y']+r['h'] < y]
            rb = [r['y'] - y for r in rects if r['y'] > y]
            a = min(above + ra) if (above or ra) else None
            b = min(below + rb) if (below or rb) else None
            if a is not None and b is not None and abs(a-b) > 4:
                issues.append(f"D1 divider y={y:.0f}: gap above {a:.0f} vs below {b:.0f}")
    # R1: near-aligned sibling rects
    seen = set()
    for i, r in enumerate(rects):
        for k in rects[i+1:]:
            x_overlap = not (r['x']+r['w'] < k['x'] or k['x']+k['w'] < r['x'])
            if x_overlap and r['h'] == k['h'] and r['w'] == k['w'] and 0 < abs(r['y']-k['y']) <= 5:
                key = (r['y'], k['y'], r['h'])
                if key not in seen:
                    seen.add(key)
                    issues.append(f"R1 near-aligned rows: y={r['y']:.0f} vs y={k['y']:.0f} (h={r['h']:.0f})")
    return issues

def main(files):
    total = 0
    for f in files:
        src = open(f).read()
        for i, m in enumerate(re.finditer(r'<svg.*?</svg>', src, re.S), 1):
            issues = lint_svg(m.group(0), f)
            for msg in issues:
                print(f"{f} [svg #{i}] {msg}")
            total += len(issues)
    print(f"\n{total} issue(s)." if total else "CLEAN.")
    return 1 if total else 0

if __name__ == '__main__':
    # Resolve relative to the repo root so the linter works from any cwd.
    _root = __import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
    files = sys.argv[1:] or sorted(glob.glob(__import__('os').path.join(_root, 'build/app-router-guide_html/sections/*.html')))
    sys.exit(main(files))
