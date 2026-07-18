#!/usr/bin/env python3
"""
One-time (re-runnable) converter: html-guide/*.html -> src/pages/*.astro.

Transforms, per page:
  - extracts the content-inner body (chrome comes from GuidePage.astro)
  - <pre class="code"> gains is:raw (Astro must not parse braces as expressions)
  - chips / callouts / go-deeper / diagrams / compare blocks become components
  - literal { } OUTSIDE is:raw blocks become &#123; / &#125;
  - wraps everything in <GuidePage title=... root=...>

Run from repo root: python3 scripts/migrate_to_astro.py
Reads the CURRENT html-guide pages, so run it before the first Astro build
overwrites them (git also holds the originals).
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CHIP_LABELS = {
    'react': 'React',
    'next': 'Next.js',
    'critical': 'Critical',
    'very': 'Very important',
    'imp': 'Important',
}


def read(p):
    with open(os.path.join(ROOT, p)) as f:
        return f.read()


def write(p, s):
    path = os.path.join(ROOT, p)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(s)


def balanced_div(s, start):
    """Given index of a '<div', return index just past its matching </div>."""
    depth = 0
    for m in re.finditer(r'<div\b|</div>', s[start:]):
        depth += 1 if m.group(0) != '</div>' else -1
        if depth == 0:
            return start + m.end()
    raise ValueError('unbalanced div')


def extract_inner(html):
    m = re.search(r'<div class="content-inner(?: cover)?">(.*)</div>\s*</main>', html, re.S)
    assert m, 'content-inner not found'
    return m.group(1)


def dedent_outside_pre(s):
    """Strip the carried-over base indentation (the old chrome's nesting)
    from every line NOT inside a <pre> block, where whitespace is content."""
    lines = s.split('\n')
    in_pre = False
    base = None
    for ln in lines:
        if not in_pre and ln.strip() and not ln.lstrip().startswith('</pre'):
            indent = len(ln) - len(ln.lstrip(' '))
            if ln.strip():
                base = indent if base is None else min(base, indent)
        if '<pre' in ln:
            in_pre = True
        if '</pre>' in ln:
            in_pre = False
    if not base:
        return s
    out = []
    in_pre = False
    for ln in lines:
        if '<pre' in ln and not in_pre:
            out.append(ln[base:] if ln[:base].isspace() or ln[:base] == ' ' * base else ln)
            in_pre = '</pre>' not in ln
            continue
        if in_pre:
            out.append(ln)
            if '</pre>' in ln:
                in_pre = False
            continue
        out.append(ln[base:] if ln.startswith(' ' * base) else ln)
    return '\n'.join(out)


def transform_chips(s):
    def repl(m):
        kind, label = m.group(1), m.group(2).strip()
        if CHIP_LABELS.get(kind) == label:
            return f'<Chip k="{kind}" />'
        return f'<Chip k="{kind}" label="{label}" />'

    return re.sub(r'<span class="chip chip-(\w+)"\s*>([^<]*)</span\s*>', repl, s)


def transform_callouts(s):
    out, i = [], 0
    pat = re.compile(r'<div class="callout callout-(\w+)">')
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(s[i:])
            break
        out.append(s[i : m.start()])
        end = balanced_div(s, m.start())
        block = s[m.start() : end]
        kind = m.group(1)
        tm = re.search(r'<div class="callout-title">\s*(.*?)\s*</div>', block, re.S)
        title = re.sub(r'\s+', ' ', tm.group(1))
        body = block[tm.end() : block.rfind('</div>')].strip('\n')
        if kind == 'info' and title == 'Where to go deeper':
            out.append(f'<GoDeeper>\n{body}\n</GoDeeper>')
        else:
            out.append(f'<Callout kind="{kind}" title="{title}">\n{body}\n</Callout>')
        i = end
    return ''.join(out)


def transform_diagrams(s):
    out, i = [], 0
    pat = re.compile(r'<figure class="diagram">')
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(s[i:])
            break
        out.append(s[i : m.start()])
        end = s.index('</figure>', m.start()) + len('</figure>')
        block = s[m.start() : end]
        cm = re.search(r'<figcaption>(.*?)</figcaption>', block, re.S)
        svg = block[len('<figure class="diagram">') : cm.start()].strip('\n')
        caption = cm.group(1).strip()
        out.append(
            f'<Diagram>\n{svg}\n<Fragment slot="caption">\n{caption}\n</Fragment>\n</Diagram>'
        )
        i = end
    return ''.join(out)


def transform_compares(s):
    out, i = [], 0
    pat = re.compile(r'<div class="compare">')
    while True:
        m = pat.search(s, i)
        if not m:
            out.append(s[i:])
            break
        out.append(s[i : m.start()])
        end = balanced_div(s, m.start())
        block = s[m.start() : end]
        cols = []
        j = len('<div class="compare">')
        while True:
            cm = re.compile(r'<div class="(bad|good)">').search(block, j)
            if not cm:
                break
            cend = balanced_div(block, cm.start())
            cblock = block[cm.start() : cend]
            lm = re.search(r'<div class="col-label">\s*(.*?)\s*</div>', cblock, re.S)
            label = re.sub(r'\s+', ' ', lm.group(1))
            body = cblock[lm.end() : cblock.rfind('</div>')].strip('\n')
            cols.append(
                f'<CompareCol kind="{cm.group(1)}" label="{label}">\n{body}\n</CompareCol>'
            )
            j = cend
        out.append('<Compare>\n' + '\n'.join(cols) + '\n</Compare>')
        i = end
    return ''.join(out)


def add_is_raw_and_escape(s):
    """pre.code gets is:raw; braces get entity-escaped everywhere else."""
    s = re.sub(r'<pre(\s+)class="code"', r'<pre\1class="code" is:raw', s)
    parts = re.split(r'(<pre[^>]*>.*?</pre>)', s, flags=re.S)
    for idx in range(0, len(parts), 2):
        parts[idx] = parts[idx].replace('{', '&#123;').replace('}', '&#125;')
    return ''.join(parts)


IMPORTS_SECTION = """---
import GuidePage from '../../layouts/GuidePage.astro';
import Chip from '../../components/Chip.astro';
import Callout from '../../components/Callout.astro';
import GoDeeper from '../../components/GoDeeper.astro';
import Diagram from '../../components/Diagram.astro';
import Compare from '../../components/Compare.astro';
import CompareCol from '../../components/CompareCol.astro';
---
"""
IMPORTS_INDEX = IMPORTS_SECTION.replace("'../../", "'../")


def convert(src_path, out_path, root, cover):
    html = read(src_path)
    title = re.search(r'<title>(.*?)</title>', html, re.S).group(1).strip()
    body = extract_inner(html)
    body = re.sub(r'\s*<div id="pager"></div>\s*$', '\n', body)
    body = dedent_outside_pre(body)
    body = transform_chips(body)
    body = transform_callouts(body)
    body = transform_diagrams(body)
    body = transform_compares(body)
    body = add_is_raw_and_escape(body)
    imports = IMPORTS_INDEX if root == '.' else IMPORTS_SECTION
    cover_attr = ' cover' if cover else ''
    page = (
        f'{imports}\n<GuidePage title="{title}" root="{root}"{cover_attr}>\n'
        f'{body.strip()}\n</GuidePage>\n'
    )
    write(out_path, page)
    print('converted', src_path, '->', out_path)


def main():
    convert('html-guide/index.html', 'src/pages/index.astro', '.', True)
    for f in sorted(os.listdir(os.path.join(ROOT, 'html-guide/sections'))):
        if f.endswith('.html'):
            convert(
                f'html-guide/sections/{f}',
                f'src/pages/sections/{f.replace(".html", ".astro")}',
                '..',
                False,
            )


if __name__ == '__main__':
    sys.exit(main())
