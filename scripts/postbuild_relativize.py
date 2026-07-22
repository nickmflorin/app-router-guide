#!/usr/bin/env python3
"""
Astro emits root-absolute asset URLs (/_astro/...), which break file://
viewing and non-root hosting. Rewrite them to relative paths per page depth.
Runs as part of `npm run build`.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'build/output/app-router-guide_html')

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

# The annotation ledger is dev-only tooling (nav.js gates the whole draft
# layer to localhost); the built output is final and must not carry it.
ledger = os.path.join(OUT, 'page-notes.json')
if os.path.exists(ledger):
    os.remove(ledger)
    print('page-notes.json stripped from build output')

# Strip the dev-only draft layer (annotation module) from the BUILT nav.js.
# The source file in public/ keeps the code between /* @dev-only:start */ ...
# /* @dev-only:end */ markers; the dev server serves those, the distributable
# never sees them.
#
# The draft-tools STYLES no longer need stripping here: they live in a separate
# SCSS partial that GuidePage.astro imports only under import.meta.env.DEV, so
# `astro build` dead-code-eliminates them and they never reach _astro/*.css.
DEV_BLOCK = re.compile(r'/\* @dev-only:start \*/.*?/\* @dev-only:end \*/\n?', re.S)
for rel in ('assets/nav.js',):
    p = os.path.join(OUT, rel)
    s = open(p).read()
    stripped, n = DEV_BLOCK.subn('', s)
    if n == 0:
        raise SystemExit(f'ERROR: no @dev-only markers found in {rel}; refusing to ship unstripped')
    open(p, 'w').write(stripped)
    print(f'dev-only draft layer stripped from {rel} ({n} block(s), {len(s) - len(stripped)} bytes)')
