#!/usr/bin/env python3
"""
Build the guide's distributables into build/output/.

    python3 scripts/build_dist.py [--output=all] [--packaging=all]
    npm run dist [-- --output=html --packaging=file]

--output     what format(s) to build: html | md | comma list | all (default all)
--packaging  what shape(s) to build:  folder | file | comma list | all (default all)
             ("module" is accepted as an alias for "folder")

Output layout:
    build/
    ├── README.md                 what this folder contains (committed, survives builds)
    └── output/                   generated, gitignored:
    ├── app-router-guide_html/   html + folder: the browsable multi-page site
    ├── app-router-guide.html    html + file:   one self-contained document
    ├── app-router-guide_md/     md + folder:   multi-page markdown docs
    ├── app-router-guide.md      md + file:     one markdown document
    (the Cowork DRAFT preview lives outside this folder, in .preview/,
     so zipping build/ ships only final outputs)

The html folder form is Astro's outDir, so it is always rebuilt fresh by the
pipeline; the html file form is bundled from it afterwards. All outputs are
FINAL: the dev-only draft layer is stripped by the pipeline.
"""
import argparse
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORMATS = ("html", "md")
PACKAGINGS = ("folder", "file")


def parse_multi(value, allowed, flag, aliases=None):
    aliases = aliases or {}
    if value.strip() == "all":
        return list(allowed)
    picked = []
    for part in value.split(","):
        part = aliases.get(part.strip(), part.strip())
        if part not in allowed:
            sys.exit(f"error: {flag} got '{part}'; expected one of "
                     f"{', '.join(allowed)}, a comma list of those, or 'all'")
        if part not in picked:
            picked.append(part)
    return picked


def run(cmd, **kw):
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=ROOT, check=True, **kw)


def prettify(glob_pattern):
    """Format a built output in place (the repo .prettierignore excludes
    build/, so the dist pipeline supplies its own ignore file)."""
    run(["npx", "prettier", "--write", "--log-level", "warn",
         "--ignore-path", "scripts/prettierignore-dist",
         "--no-error-on-unmatched-pattern", glob_pattern])


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--output", default="all",
                    help="html | md | comma list | all (default: all)")
    ap.add_argument("--packaging", default="all",
                    help="folder | file | comma list | all; 'module' = 'folder' (default: all)")
    args = ap.parse_args()

    formats = parse_multi(args.output, FORMATS, "--output")
    packagings = parse_multi(args.packaging, PACKAGINGS, "--packaging",
                             aliases={"module": "folder"})

    built, skipped = [], []

    if "html" in formats:
        # The full pipeline: astro build (outDir = build/output/app-router-guide_html),
        # relativize + strip draft layer, regenerate the search index. The
        # folder form falls straight out of this; the file form bundles it.
        run(["npm", "run", "build"])
        if "folder" in packagings:
            built.append("build/output/app-router-guide_html/  (multi-page site)")
        if "file" in packagings:
            run([sys.executable, "scripts/build_artifact.py", "--final",
                 "--out", "build/output/app-router-guide.html"])
            prettify("build/output/app-router-guide.html")
            built.append("build/output/app-router-guide.html   (single file)")

    if "md" in formats:
        # md is derived from the built html site; make sure it exists/is fresh.
        if "html" not in formats:
            run(["npm", "run", "build"])
        run([sys.executable, "scripts/build_md.py",
             "--packaging", ",".join(packagings)])
        if "folder" in packagings:
            prettify("build/output/app-router-guide_md/**/*.md")
        if "file" in packagings:
            prettify("build/output/app-router-guide.md")
        if "folder" in packagings:
            built.append("build/output/app-router-guide_md/    (multi-page markdown)")
        if "file" in packagings:
            built.append("build/output/app-router-guide.md     (single-file markdown)")

    print("\ndist summary")
    for b in built:
        print(f"  built:   {b}")
    for sk in skipped:
        print(f"  skipped: {sk}")
    if not built and not skipped:
        print("  nothing to do")


if __name__ == "__main__":
    main()
