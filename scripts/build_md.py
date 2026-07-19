#!/usr/bin/env python3
"""
Deterministic HTML -> Markdown conversion of the built guide.

    python3 scripts/build_md.py [--packaging folder,file]

Reads build/output/app-router-guide_html/ (the FINAL multi-page site) and writes:
    build/output/app-router-guide_md/     folder form: index.md + NN-slug.md, flat,
                                   cross-linked via relative .md#anchor links
    build/output/app-router-guide.md      file form: one document, anchors namespaced
                                   per chapter (chNN-...) like the html bundle

Content only: no sidebar, no pager, no search, no draft layer (the html input
is already final). index.md opens with a generated table of contents.

Diagrams are NOT converted (that step needs judgment, later a Mermaid pass);
each becomes an HTML comment placeholder carrying the figure's caption so the
future pass knows what to draw.
"""
import argparse
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "build", "output", "app-router-guide_html")

VOID = {"br", "hr", "img", "meta", "link", "input",
        "circle", "line", "rect", "path", "marker", "use", "text"}


def read(p):
    with open(p) as f:
        return f.read()


# ---------------- TOC (same tolerant parse as the other scripts) ----------------
nav = read(os.path.join(SITE, "assets", "nav.js"))
group_re = re.compile(r"\{\s*part:\s*(null|['\"][^'\"]*['\"])\s*,\s*items:\s*\[(.*?)\]\s*,?\s*\}", re.S)
item_re = re.compile(
    r"\{\s*n:\s*(['\"])(\d+)\1\s*,\s*title:\s*(['\"])(.*?)\3\s*,\s*file:\s*(['\"])(.*?)\5\s*,?\s*\}", re.S)
GROUPS = []
for gm in group_re.finditer(nav):
    part = None if gm.group(1) == "null" else gm.group(1)[1:-1]
    items = [dict(n=int(im.group(2)), title=im.group(4).replace("\\'", "'"), file=im.group(6))
             for im in item_re.finditer(gm.group(2))]
    GROUPS.append(dict(part=part, items=items))
FLAT = [i for g in GROUPS for i in g["items"]]
assert len(FLAT) >= 18, "TOC parse failed"


# ---------------- tiny DOM ----------------
class Node:
    __slots__ = ("tag", "attrs", "children")

    def __init__(self, tag, attrs=None):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.children = []

    def cls(self):
        return (self.attrs.get("class") or "").split()

    def has(self, c):
        return c in self.cls()

    def text(self):
        out = []
        for ch in self.children:
            out.append(ch if isinstance(ch, str) else ch.text())
        return "".join(out)


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def parse(fragment):
    tb = TreeBuilder()
    tb.feed(fragment)
    return tb.root


# ---------------- conversion ----------------
# NOTE on mermaid theming: third-party renderers (VS Code preview, GitHub)
# ignore or sanitize init-directive theming (themeCSS, font variables) and
# measure labels with their own fonts. Twins therefore style everything
# IN-DIAGRAM (classDef, style, linkStyle default), which is part of the
# mermaid language and portable; no init block is injected here.
SP = re.compile(r"\s+")


def squash(s):
    return SP.sub(" ", s).strip()


class Converter:
    """One page -> markdown blocks. link_map rewrites 'NN-slug.html#a' style
    targets; anchor(id) formats heading anchors (namespacing for file form)."""

    def __init__(self, link_map, anchor):
        self.link_map = link_map
        self.anchor = anchor

    # ---- inline ----
    def inline(self, node, table=False):
        out = []
        for ch in node.children:
            if isinstance(ch, str):
                # literal angle brackets in prose must not read as HTML in md
                out.append(SP.sub(" ", ch).replace("<", "\\<"))
                continue
            c = ch
            if c.tag in ("strong", "b"):
                inner = squash(self.inline(c, table))
                if inner:
                    out.append(f"**{inner}**")
            elif c.tag in ("em", "i"):
                inner = squash(self.inline(c, table))
                if inner:
                    out.append(f"*{inner}*")
            elif c.tag == "code":
                txt = c.text()
                fence = "``" if "`" in txt else "`"
                out.append(f"{fence}{txt}{fence}")
            elif c.tag == "a":
                label = squash(self.inline(c, table)) or c.text().strip()
                out.append(f"[{label}]({self.link_map(c.attrs.get('href', ''))})")
            elif c.tag == "span" and c.has("chip"):
                out.append(f"**`{squash(c.text())}`**")
            elif c.tag == "br":
                out.append(" " if table else "\n")
            elif c.tag == "svg":
                pass
            else:  # transparent spans/divs
                out.append(self.inline(c, table))
        s = "".join(out)
        if table:
            s = s.replace("|", "\\|")
        return s

    def para(self, node):
        return squash(self.inline(node))

    # ---- blocks ----
    def blocks(self, parent, page):
        out = []
        for ch in parent.children:
            if isinstance(ch, str):
                if ch.strip():
                    out.append(squash(ch))
                continue
            out.extend(self.block(ch, page))
        return out

    def block(self, n, page):
        t, has = n.tag, n.has
        if t in ("h1", "h2", "h3", "h4"):
            level = "#" * int(t[1])
            hid = n.attrs.get("id")
            a = f'<a id="{self.anchor(page, hid)}"></a>' if hid else ""
            return [f"{level} {a}{self.para(n)}"]
        if t == "p":
            body = self.para(n)
            if not body:
                return []
            return [f"*{body}*"] if has("lede") else [body]
        if t == "hr":
            return ["---"]
        if t in ("ul", "ol"):
            return [self.list_block(n, page, ordered=(t == "ol"))]
        if t == "table":
            return [self.table_block(n)]
        if t == "figure" and has("diagram"):
            return [self.diagram_block(n)]
        if t == "pre" and has("code"):
            return self.pre_block(n)
        if t == "div":
            if has("kicker"):
                return [f"*{self.para(n)}*"]
            if has("snippet") or has("compare"):
                return self.blocks(n, page)
            if has("bad") or has("good"):
                return self.blocks(n, page)
            if has("col-label"):
                return [f"**{self.para(n)}**"]
            if has("code-caption"):
                return [f"> {self.para(n)}"]
            if has("callout"):
                return [self.callout_block(n, page)]
            if has("goal-card"):
                return self.goal_card_block(n, page)
            if has("legend"):
                return self.legend_block(n, page)
            if has("toc-grid"):
                return []  # replaced by the generated TOC on index.md
            if n.attrs.get("id") == "pager":
                return []
            return self.blocks(n, page)  # transparent wrapper
        if t == "blockquote":
            return ["\n".join("> " + l for l in self.para(n).split("\n"))]
        if t in ("script", "style", "nav", "svg"):
            return []
        return self.blocks(n, page)

    def list_block(self, n, page, ordered, indent=0):
        lines = []
        idx = 0
        pad = " " * indent
        for li in n.children:
            if isinstance(li, str) or li.tag != "li":
                continue
            idx += 1
            marker = f"{idx}." if ordered else "-"
            if li.has("") and False:
                pass
            # goal-list items: g-text + g-chips + g-ref
            if any(not isinstance(c, str) and c.tag == "span" and c.has("g-text") for c in li.children):
                parts = []
                for c in li.children:
                    if isinstance(c, str):
                        continue
                    if c.has("g-text"):
                        parts.append(self.para(c))
                    elif c.has("g-chips"):
                        parts.append(self.inline(c).strip())
                    elif c.has("g-ref"):
                        parts.append("— " + squash(self.inline(c)))
                lines.append(f"{pad}{marker} " + " ".join(p for p in parts if p))
                continue
            # split inline flow from nested blocks
            inline_nodes, block_nodes = Node("x"), []
            for c in li.children:
                if not isinstance(c, str) and (
                    c.tag in ("ul", "ol", "table", "figure")
                    or (c.tag == "pre" and c.has("code"))
                    or (c.tag == "div" and (c.has("snippet") or c.has("callout")))
                ):
                    block_nodes.append(c)
                else:
                    inline_nodes.children.append(c)
            head = squash(self.inline(inline_nodes))
            lines.append(f"{pad}{marker} {head}".rstrip())
            for b in block_nodes:
                if b.tag in ("ul", "ol"):
                    lines.append(self.list_block(b, page, ordered=(b.tag == "ol"), indent=indent + 2))
                else:
                    sub = self.block(b, page)
                    body = "\n\n".join(sub)
                    lines.append("\n".join(
                        (pad + "  " + l) if l else "" for l in body.split("\n")))
        return "\n".join(lines) if not any("\n\n" in l for l in lines) else "\n\n".join(lines)

    def table_block(self, n):
        rows = []
        for tr in self._find_all(n, "tr"):
            cells = [c for c in tr.children if not isinstance(c, str) and c.tag in ("td", "th")]
            rows.append([squash(self.inline(c, table=True)) for c in cells])
        if not rows:
            return ""
        width = max(len(r) for r in rows)
        rows = [r + [""] * (width - len(r)) for r in rows]
        out = ["| " + " | ".join(rows[0]) + " |",
               "| " + " | ".join(["---"] * width) + " |"]
        out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
        return "\n".join(out)

    def diagram_block(self, n):
        cap_md, cap_plain, mermaid = "", "", None
        for c in n.children:
            if isinstance(c, str):
                continue
            if c.tag == "figcaption":
                cap_md = squash(self.inline(c))
                cap_plain = squash(self.inline_plain(c))
            elif c.tag == "template" and "data-mermaid" in c.attrs:
                mermaid = self.raw_text(c).strip("\n").strip()
        if mermaid:
            out = f"```mermaid\n{mermaid}\n```"
            if cap_md:
                out += f"\n\n> {cap_md}"
            return out
        desc = cap_plain or "an illustration for this section (the source figure has no caption)"
        desc = desc.replace("--", "- -")  # '--' is illegal inside html comments
        return ("<!-- DIAGRAM PLACEHOLDER: to be converted to a Mermaid diagram "
                "in a later pass. The diagram shows: " + desc + " -->")

    def raw_text(self, node):
        # text with <br/> re-emitted literally (mermaid line breaks in labels)
        out = []
        for ch in node.children:
            if isinstance(ch, str):
                out.append(ch)
            elif ch.tag == "br":
                out.append("<br/>")
            else:
                out.append(self.raw_text(ch))
        return "".join(out)

    def inline_plain(self, node):
        # like inline(), but plain text (used inside comments: no md markup)
        return node.text()

    def pre_block(self, n):
        filename = None
        parts = []
        for c in n.children:
            if isinstance(c, str):
                parts.append(c)
            elif c.tag == "span" and c.has("filename"):
                filename = squash(c.text())
            else:
                parts.append(c.text() if not isinstance(c, str) else c)
        code = "".join(parts)
        code = code.strip("\n")
        lang = "text" if ("├──" in code or "└──" in code) else "tsx"
        out = []
        if filename:
            out.append(f"**`{filename}`**" if " " not in filename
                       else f"**{filename}**")
        out.append(f"```{lang}\n{code}\n```")
        return out

    def callout_block(self, n, page):
        title, body = "", []
        for c in n.children:
            if isinstance(c, str):
                continue
            if c.has("callout-title"):
                title = squash(self.inline(c))
            else:
                body.extend(self.block(c, page))
        lines = [f"> **{title}**", ">"] if title else []
        for i, b in enumerate(body):
            if i:
                lines.append(">")
            lines += ["> " + l if l else ">" for l in b.split("\n")]
        return "\n".join(lines)

    def goal_card_block(self, n, page):
        out = []
        for c in n.children:
            if isinstance(c, str):
                continue
            if c.has("goal-head"):
                letter, h3 = "", None
                for g in c.children:
                    if isinstance(g, str):
                        continue
                    if g.has("goal-letter"):
                        letter = squash(g.text())
                    elif g.tag == "h3":
                        h3 = g
                if h3 is not None:
                    hid = h3.attrs.get("id")
                    a = f'<a id="{self.anchor(page, hid)}"></a>' if hid else ""
                    label = (letter + " — " if letter else "") + self.para(h3)
                    out.append(f"### {a}{label}")
            elif c.has("goal-tag"):
                out.append(f"*{self.para(c)}*")
            else:
                out.extend(self.block(c, page))
        return out

    def legend_block(self, n, page):
        out = []
        for box in n.children:
            if isinstance(box, str) or not box.has("legend-box"):
                continue
            for c in box.children:
                if isinstance(c, str):
                    continue
                if c.tag == "h4":
                    out.append(f"**{self.para(c)}**")
                elif c.has("legend-row"):
                    chip, desc = "", ""
                    for g in c.children:
                        if isinstance(g, str):
                            continue
                        if g.has("chip"):
                            chip = f"**`{squash(g.text())}`**"
                        elif g.has("desc"):
                            desc = self.para(g)
                    out.append(f"- {chip} — {desc}")
        # merge consecutive list items into single blocks per box
        merged, buf = [], []
        for b in out:
            if b.startswith("- "):
                buf.append(b)
            else:
                if buf:
                    merged.append("\n".join(buf))
                    buf = []
                merged.append(b)
        if buf:
            merged.append("\n".join(buf))
        return merged

    def _find_all(self, n, tag):
        found = []
        for c in n.children:
            if isinstance(c, str):
                continue
            if c.tag == tag:
                found.append(c)
            found.extend(self._find_all(c, tag))
        return found


# ---------------- page assembly ----------------
def extract_inner(html_text):
    m = re.search(r'<div class="content-inner(?: cover)?">(.*)</div>\s*</main>', html_text, re.S)
    assert m, "content-inner not found"
    return m.group(1)


def toc_md(link_to):
    lines = ["## Contents", ""]
    for g in GROUPS:
        if g["part"]:
            lines.append(f"**{g['part']}**")
            lines.append("")
        for it in g["items"]:
            lines.append(f"{it['n']}. [{it['title']}]({link_to(it)})")
        lines.append("")
    return "\n".join(lines).rstrip()


def convert_page(path, page, link_map, anchor):
    conv = Converter(link_map, anchor)
    root = parse(extract_inner(read(path)))
    blocks = [b for b in conv.blocks(root, page) if b]
    # drop the cover's in-page "Contents" heading (grid already dropped)
    blocks = [b for b in blocks if not re.fullmatch(r"##\s*(<a[^>]*></a>)?Contents", b)]
    return blocks


def build_folder():
    outdir = os.path.join(ROOT, "build", "output", "app-router-guide_md")
    os.makedirs(outdir, exist_ok=True)

    def link_map(href):
        if not href or href.startswith(("http", "mailto")):
            return href
        href = href.replace("sections/", "").replace("../index.html", "index.md")
        return re.sub(r"([\w-]+)\.html", r"\1.md", href)

    def anchor(page, hid):
        return hid

    # cover -> index.md, with the generated TOC after the lede
    blocks = convert_page(os.path.join(SITE, "index.html"), "index", link_map, anchor)
    toc = toc_md(lambda it: it["file"].replace(".html", ".md"))
    insert_at = 1
    for i, b in enumerate(blocks[:4]):
        if b.startswith("*"):
            insert_at = i + 1
    blocks.insert(insert_at, toc)
    write_md(os.path.join(outdir, "index.md"), blocks)

    for it in FLAT:
        md_name = it["file"].replace(".html", ".md")
        blocks = convert_page(os.path.join(SITE, "sections", it["file"]), md_name, link_map, anchor)
        blocks.insert(0, "[← Contents](index.md)")
        write_md(os.path.join(outdir, md_name), blocks)
    print(f"markdown folder: {len(FLAT) + 1} files -> build/output/app-router-guide_md/")


def build_file():
    def anchor_for(page_ch, hid):
        return f"{page_ch}-{hid}" if hid else page_ch

    file_of = {it["file"]: f"ch{it['n']}" for it in FLAT}

    def make_link_map(current_ch):
        def link_map(href):
            if not href or href.startswith(("http", "mailto")):
                return href
            href = href.replace("sections/", "")
            if href in ("index.html", "../index.html"):
                return "#contents"
            if href.startswith("#"):  # same-page anchor
                return f"#{current_ch}-{href[1:]}"
            m = re.match(r"([\w-]+\.html)(?:#([\w-]+))?$", href)
            if m and m.group(1) in file_of:
                ch = file_of[m.group(1)]
                return f"#{ch}-{m.group(2)}" if m.group(2) else f"#{ch}"
            return href
        return link_map

    parts = []
    cover_blocks = convert_page(os.path.join(SITE, "index.html"), "cover",
                                make_link_map("cover"), lambda p, h: h and f"cover-{h}")
    toc = '<a id="contents"></a>\n\n' + toc_md(lambda it: f"#ch{it['n']}")
    insert_at = 1
    for i, b in enumerate(cover_blocks[:4]):
        if b.startswith("*"):
            insert_at = i + 1
    cover_blocks.insert(insert_at, toc)
    parts.append("\n\n".join(cover_blocks))

    for it in FLAT:
        ch = f"ch{it['n']}"
        blocks = convert_page(os.path.join(SITE, "sections", it["file"]), ch,
                              make_link_map(ch), lambda p, h, c=ch: f"{c}-{h}")
        blocks.insert(0, f'<a id="{ch}"></a>')
        parts.append("\n\n".join(blocks))

    doc = "\n\n---\n\n".join(parts) + "\n"
    out = os.path.join(ROOT, "build", "output", "app-router-guide.md")
    with open(out, "w") as f:
        f.write(doc)
    print(f"markdown file: {len(doc) // 1024} KB -> build/output/app-router-guide.md")


def write_md(path, blocks):
    with open(path, "w") as f:
        f.write("\n\n".join(blocks).rstrip() + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--packaging", default="folder,file")
    args = ap.parse_args()
    packs = [p.strip() for p in args.packaging.split(",")]
    if not os.path.isdir(SITE):
        sys.exit("error: build/output/app-router-guide_html/ not found; run the html build first")
    if "folder" in packs or "all" in packs:
        build_folder()
    if "file" in packs or "all" in packs:
        build_file()


if __name__ == "__main__":
    main()
