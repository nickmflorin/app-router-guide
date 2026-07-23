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

# The dev-only tooling (notes + deck designation) lives in src/dev/, loaded
# only under `astro dev` via an import.meta.env.DEV-gated script tag in
# GuidePage.astro, and the draft styles are a DEV-gated SCSS import — so
# `astro build` output should contain none of it. VERIFY that instead of
# trusting it: if any dev-tooling fingerprint reaches the build, fail loudly
# rather than ship it.
import glob

checks = {
    os.path.join(OUT, 'assets', 'nav.js'): ('/api/notes', '/api/deck', 'arg-notes-v1', 'deckArmed', 'draft-tools'),
}
for page in glob.glob(os.path.join(OUT, '**', '*.html'), recursive=True):
    checks[page] = ('draft-badge', 'deck-link', 'note-pin', 'deck-panel', 'src/dev/')
for css in glob.glob(os.path.join(OUT, '_astro', '*.css')):
    checks[css] = ('note-pin', 'deck-panel', 'draft-badge', 'note-toast')

bad = []
for path, needles in checks.items():
    body = open(path, encoding='utf-8').read()
    for n in needles:
        if n in body:
            bad.append(f'{os.path.relpath(path, OUT)}: {n!r}')
if bad:
    raise SystemExit('ERROR: dev tooling leaked into the build output:\n  ' + '\n  '.join(bad))
print(f'dev-tooling gate: clean ({len(checks)} files checked); draft layer verified absent')
