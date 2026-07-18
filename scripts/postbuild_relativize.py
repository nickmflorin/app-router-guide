#!/usr/bin/env python3
"""
Astro emits root-absolute asset URLs (/_astro/...), which break file://
viewing and non-root hosting. Rewrite them to relative paths per page depth.
Runs as part of `npm run build`.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'html-guide')

for dirpath, _, files in os.walk(OUT):
    depth = os.path.relpath(dirpath, OUT)
    prefix = '' if depth == '.' else '../' * (depth.count(os.sep) + 1)
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(dirpath, f)
        with open(p) as fh:
            s = fh.read()
        s2 = re.sub(r'(href|src)="/_astro/', rf'\1="{prefix}_astro/', s)
        if s2 != s:
            with open(p, 'w') as fh:
                fh.write(s2)
print('asset URLs relativized')
