#!/usr/bin/env python3
"""
Phase-1 parity check: after `npm run build`, compare the freshly built
html-guide/*.html against the pre-migration versions in git HEAD (or a given
ref). Normalizes whitespace between tags so formatting differences don't
count; reports any real DOM/text drift.

Run: python3 scripts/verify_build.py [git-ref]   (default: HEAD)
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'


def normalize(html):
    # Drop comments, collapse all whitespace runs, trim between tags.
    html = re.sub(r'<!--.*?-->', '', html, flags=re.S)
    html = re.sub(r'\s+', ' ', html)
    html = re.sub(r'> <', '><', html)
    return html.strip()


def old(path):
    r = subprocess.run(['git', 'show', f'{REF}:{path}'], cwd=ROOT, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def main():
    pages = ['html-guide/index.html'] + sorted(
        'html-guide/sections/' + f
        for f in os.listdir(os.path.join(ROOT, 'html-guide/sections'))
        if f.endswith('.html')
    )
    bad = 0
    for p in pages:
        before = old(p)
        if before is None:
            print('NEW PAGE (no baseline):', p)
            continue
        with open(os.path.join(ROOT, p)) as f:
            after = f.read()
        a, b = normalize(before), normalize(after)
        if a != b:
            # Find the first divergence for a useful report.
            i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
            print(f'DIFF {p} @ {i}:')
            print('  old:', a[max(0, i - 60) : i + 90])
            print('  new:', b[max(0, i - 60) : i + 90])
            bad += 1
    print('PARITY OK' if not bad else f'{bad} page(s) differ')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
