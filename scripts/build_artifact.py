#!/usr/bin/env python3
"""
Bundle the multi-page guide into ONE self-contained HTML file for publishing
as a Claude artifact (.preview/artifact.html; NOT a distributable).

- Parses the TOC from src/data/toc.js (single source of truth), so section
  renumbers propagate automatically.
- Each page becomes a <section class="chapter"> shown/hidden by a tiny hash
  router (#ch5, #ch5-refresh, #cover), preserving the multi-page feel.
- Every id, url(#...) reference, and internal href is namespaced per chapter
  so duplicate anchors (e.g. id="rules") and duplicate SVG marker ids don't
  collide in the combined document.
- style.css inlined; logomark.svg inlined as a data URI; the IDE code-wrap
  logic from nav.js is reproduced; DRAFT badge included.

Run:  python3 scripts/build_artifact.py
Then publish/update the Claude artifact from .preview/artifact.html.
"""
import argparse
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser(description="Bundle the guide into one HTML file.")
ap.add_argument("--final", action="store_true",
                help="distributable mode: no DRAFT badge/title, stripped (final) CSS")
ap.add_argument("--out", default=None,
                help="output path (default: build/artifact.html)")
ARGS = ap.parse_args()


def read(p):
    with open(os.path.join(ROOT, p)) as f:
        return f.read()


# ---------- TOC from src/data/toc.js (the single TOC source) ----------
nav = read("src/data/toc.js")
groups = []
# Tolerant of prettier's formatting: single or double quotes, multi-line
# objects, trailing commas.
group_re = re.compile(r"\{\s*part:\s*(null|['\"][^'\"]*['\"])\s*,(?:\s*cls:\s*['\"][^'\"]*['\"]\s*,)?\s*items:\s*\[(.*?)\]\s*,?\s*\}", re.S)
item_re = re.compile(r"\{\s*n:\s*(['\"])(\d+)\1\s*,\s*title:\s*(['\"])(.*?)\3\s*,\s*file:\s*(['\"])(.*?)\5[^{}]*\}", re.S)
for gm in group_re.finditer(nav):
    part = None if gm.group(1) == "null" else gm.group(1)[1:-1]
    items = []
    for im in item_re.finditer(gm.group(2)):
        items.append(dict(n=int(im.group(2)), title=im.group(4), file=im.group(6)))
    groups.append(dict(part=part, items=items))
flat = [i for g in groups for i in g["items"]]
assert len(flat) >= 18, "TOC parse failed"

# ---------- content extraction + namespacing ----------
def extract_inner(html_text):
    # Greedy up to the last </div> before </main> — indentation-agnostic, so
    # prettier reformatting can't break the extraction.
    m = re.search(r'<div class="content-inner(?: cover)?">(.*)</div>\s*</main>', html_text, re.S)
    assert m, "content-inner not found"
    return m.group(1)


def namespace(content, tag):
    # Cross-file links first: NN-slug.html#anchor / NN-slug.html (optionally
    # prefixed with sections/ on the cover page).
    def xfile(m):
        n = int(m.group(1))
        frag = m.group(2)
        return f'href="#ch{n}-{frag}"' if frag else f'href="#ch{n}"'
    content = re.sub(r'href="(?:sections/)?(\d\d)-[a-z-]+\.html(?:#([\w-]+))?"', xfile, content)
    content = re.sub(r'href="(?:\.\./)?index\.html"', 'href="#cover"', content)
    # Same-page anchors, ids, and SVG url() references.
    content = re.sub(r'href="#([\w-]+)"', lambda m: f'href="#{tag}-{m.group(1)}"', content)
    content = re.sub(r'\bid="([\w-]+)"', lambda m: f'id="{tag}-{m.group(1)}"', content)
    content = re.sub(r'url\(#([\w-]+)\)', lambda m: f'url(#{tag}-{m.group(1)})', content)
    # Drop the per-page pager placeholder (a namespaced one survives otherwise).
    # It ships empty but carries data-prev/next attributes, so match by regex.
    content = re.sub(rf'<div\s+id="{tag}-pager"[^>]*></div>', "", content)
    return content


chapters_html = []

cover = namespace(extract_inner(read("build/output/app-router-guide_html/index.html")), "cover")
chapters_html.append(f'<section class="chapter" id="cover"><div class="content-inner cover">{cover}</div></section>')

for idx, item in enumerate(flat):
    raw = read(f'build/output/app-router-guide_html/sections/{item["file"]}')
    inner = namespace(extract_inner(raw), f'ch{item["n"]}')
    prev_i = flat[idx - 1] if idx > 0 else None
    next_i = flat[idx + 1] if idx + 1 < len(flat) else None
    pager = '<div class="pager">'
    pager += (f'<a href="#ch{prev_i["n"]}"><span class="dir">&larr; Previous</span>'
              f'<span class="title">{prev_i["n"]}. {prev_i["title"]}</span></a>') if prev_i else '<span style="flex:1"></span>'
    pager += (f'<a class="next" href="#ch{next_i["n"]}"><span class="dir">Next &rarr;</span>'
              f'<span class="title">{next_i["n"]}. {next_i["title"]}</span></a>') if next_i else '<span style="flex:1"></span>'
    pager += "</div>"
    chapters_html.append(
        f'<section class="chapter" id="ch{item["n"]}"><div class="content-inner">{inner}{pager}</div></section>'
    )

# ---------- sidebar ----------
logo_uri = "data:image/svg+xml;base64," + base64.b64encode(read("build/output/app-router-guide_html/assets/logomark.svg").encode()).decode()
side = [f'<a class="brand" href="#cover" title="Back to the table of contents">'
        f'<div style="display:flex;align-items:center;justify-content:center;gap:4px;">'
        f'<img class="mark" src="{logo_uri}" alt="Craft Education"></div>'
        f'<span><span class="brand-title">App Router Guide</span>'
        f'<span class="brand-sub">Craft Education &middot; Next.js 16 / React 19</span></span></a>']
for g in groups:
    if g["part"]:
        side.append(f'<div class="part-label">{g["part"]}</div>')
    for i in g["items"]:
        side.append(f'<a class="toc-item" data-ch="ch{i["n"]}" href="#ch{i["n"]}"><span class="n">{i["n"]}</span>{i["title"]}</a>')
sidebar = "\n".join(side)

# ---------- scripts: hash router + code wrap (mirrors assets/nav.js) ----------
script = r"""
(function () {
  var chapters = document.querySelectorAll("section.chapter");
  var items = document.querySelectorAll(".toc-item");
  function show(hash) {
    var target = (hash || "").replace(/^#/, "") || "cover";
    var m = target.match(/^(ch\d+)(?:-[\w-]+)?$/);
    var chId = m ? m[1] : "cover";
    chapters.forEach(function (c) { c.classList.toggle("active", c.id === chId); });
    items.forEach(function (a) { a.classList.toggle("current", a.getAttribute("data-ch") === chId); });
    if (m && m[0] !== chId) {
      var el = document.getElementById(target);
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () { show(location.hash); });
  show(location.hash);
})();

/* IDE-style code wrapping — mirrors assets/nav.js. */
(function () {
  var WRAP_OFFSET = 0;
  document.querySelectorAll("pre.code").forEach(function (pre) {
    var lines = [];
    var line = document.createElement("div");
    line.className = "code-line";
    var breakLine = function () {
      lines.push(line);
      line = document.createElement("div");
      line.className = "code-line";
    };
    var addSplit = function (text, makeNode) {
      text.split("\n").forEach(function (part, i) {
        if (i > 0) breakLine();
        if (part) line.appendChild(makeNode(part));
      });
    };
    var filename = null;
    Array.prototype.slice.call(pre.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        addSplit(node.textContent, function (t) { return document.createTextNode(t); });
      } else if (node.classList && node.classList.contains("filename")) {
        filename = node;
      } else if (node.textContent.includes("\n") && node.children.length === 0) {
        addSplit(node.textContent, function (t) {
          var s = node.cloneNode(false);
          s.textContent = t;
          return s;
        });
      } else {
        line.appendChild(node.cloneNode(true));
      }
    });
    lines.push(line);
    pre.textContent = "";
    if (filename) pre.appendChild(filename);
    lines.forEach(function (l) {
      var text = l.textContent;
      var lead = (text.match(/^ */) || [""])[0].length;
      var body = text.slice(lead);
      var hang = lead + WRAP_OFFSET;
      if (body.indexOf("{/*") === 0) hang = lead + 4;
      else if (body.indexOf("/*") === 0) hang = lead + 3;
      else if (body.indexOf("//") === 0) hang = lead + 3;
      var indent = text.trim() ? hang : 0;
      l.style.paddingLeft = indent + "ch";
      l.style.textIndent = -indent + "ch";
      pre.appendChild(l);
    });
  });
})();
"""

# All page CSS Astro compiles (the SCSS design system + the Tailwind theme
# tokens and fill-dg-*/stroke-dg-* diagram utilities) is emitted into
# _astro/*.css and linked per page in the folder build. The single file has no
# <link>s, so inline it or the guide loses all styling. We read the stylesheet
# links from a built page in DOCUMENT ORDER so the inlined cascade matches what
# the browser applies in the folder build (rather than a hash-sorted glob).
# Built by `astro build`, so this exists in both modes.
_index = read("build/output/app-router-guide_html/index.html")
_css_rels = re.findall(r'<link rel="stylesheet" href="[^"]*?(_astro/[\w.-]+\.css)"', _index)
assert _css_rels, "no _astro stylesheet links found in built index.html"
astro_css = "".join(
    read(f"build/output/app-router-guide_html/{rel}") + "\n" for rel in _css_rels
)

# The draft layer (badge + annotation styles) is compiled only in dev
# (import.meta.env.DEV gates its import in GuidePage.astro), so it is absent
# from `astro build` output. Final mode ships without it; the draft artifact
# needs it to style the DRAFT badge, so inline the partial raw — it is plain
# CSS — with only the /* @dev-only */ markers removed.
draft_css = "" if ARGS.final else re.sub(
    r'/\* @dev-only:(?:start|end) \*/\n?', '', read("src/styles/partials/_draft-tools.scss")
)

extra_css = """
:root { color-scheme: light; }
section.chapter { display: none; }
section.chapter.active { display: block; }
"""

doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The App Router Guide — Craft Education{'' if ARGS.final else ' (DRAFT)'}</title>
<link rel="icon" href="{logo_uri}">
<style>
{astro_css}
{draft_css}
{extra_css}
</style>
</head>
<body>
{'' if ARGS.final else '<div class="draft-badge">DRAFT</div>'}
<div class="shell">
  <nav class="sidebar" id="sidebar">
{sidebar}
  </nav>
  <main class="content">
{chr(10).join(chapters_html)}
  </main>
</div>
<script>
{script}
</script>
</body>
</html>
"""

os.makedirs(os.path.join(ROOT, ".preview"), exist_ok=True)
out = os.path.join(ROOT, ARGS.out) if ARGS.out else os.path.join(ROOT, ".preview", "artifact.html")
with open(out, "w") as f:
    f.write(doc)

# ---------- sanity checks ----------
leftover = [h for h in re.findall(r'href="([^"#][^"]*\.html[^"]*)"', doc) if not h.startswith("http")]
ids = re.findall(r'\bid="([\w-]+)"', doc)
dupes = {i for i in ids if ids.count(i) > 1}
print(f"wrote {out} ({len(doc)//1024} kB)")
print("leftover .html hrefs:", leftover[:5] if leftover else "none")
print("duplicate ids:", sorted(dupes)[:5] if dupes else "none")
sys.exit(1 if (leftover or dupes) else 0)
