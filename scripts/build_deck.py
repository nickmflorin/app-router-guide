#!/usr/bin/env python3
"""
Build the slide-deck distributable: one self-contained presentation HTML.

    python3 scripts/build_deck.py [--db PATH] [--html-dir DIR] [--out FILE]

The deck's SHAPE (which blocks, on which slides, in what order/layout) comes
from the committed SQLite DB (Slide/SlideItem). The deck's CONTENT is pulled
LIVE from the built guide HTML by data-content-id, so the deck always reflects
the current document; nothing about the content is stored in the DB.

The output inlines the guide CSS, the extracted blocks (window.__BLOCKS__), the
deck data (window.__DECK__), and public/assets/deck-view.js, so the single file
opens as a full-screen presentation with no server.
"""
# NOTE (2026-07-23): currently NOT wired into build_dist.py (deck output is
# temporarily disabled), and _deck-view.scss no longer ships in the guide's CSS
# bundle (it is imported only by src/dev/deck.astro). When re-enabling this
# script, it must compile/inline the deck styles itself rather than relying on
# the _astro bundle to contain them.
import argparse
import glob
import json
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_deck(db_path):
    """Return {slides:[{id,order,title,layout,items:[...]}]} from the DB, or
    an empty deck if the file/tables aren't there yet."""
    if not os.path.exists(db_path):
        return {"slides": []}
    con = sqlite3.connect(db_path)
    try:
        try:
            slide_rows = con.execute(
                'select id, "order", title, layout from Slide order by "order" asc'
            ).fetchall()
        except sqlite3.OperationalError:
            return {"slides": []}
        items_by_slide = {}
        try:
            for r in con.execute(
                'select id, slideId, page, contentRef, "order", included, altText from SlideItem '
                'order by "order" asc'
            ):
                items_by_slide.setdefault(r[1], []).append(
                    {
                        "id": r[0],
                        "slideId": r[1],
                        "page": r[2],
                        "contentRef": r[3],
                        "order": r[4],
                        "included": bool(r[5]),
                        "altText": r[6] or None,
                    }
                )
        except sqlite3.OperationalError:
            pass
        slides = [
            {
                "id": s[0],
                "order": s[1],
                "title": s[2] or "",
                "layout": s[3] or "free",
                "items": items_by_slide.get(s[0], []),
            }
            for s in slide_rows
        ]
        return {"slides": slides}
    finally:
        con.close()


def extract_block(html, content_id):
    """Return the outerHTML of the element carrying data-content-id=content_id,
    matching nested tags of the same name to find the correct close."""
    m = re.search(
        r'<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\bdata-content-id="' + re.escape(content_id) + r'"[^>]*>',
        html,
    )
    if not m:
        return None
    tag, start = m.group(1), m.start()
    depth = 0
    for mm in re.finditer(r"<(/?)" + tag + r"\b", html[start:]):
        if mm.group(1) == "":
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                close_at = start + mm.start()
                gt = html.index(">", close_at)
                return html[start : gt + 1]
    return None


def collect_blocks(deck, html_dir):
    """contentRef -> outerHTML, pulled from each referenced section's built HTML."""
    refs = []
    for s in deck["slides"]:
        for it in s["items"]:
            if it["contentRef"] not in refs:
                refs.append(it["contentRef"])
    page_cache = {}
    blocks, missing = {}, []
    for ref in refs:
        slug = ref.split("::")[0]
        if slug not in page_cache:
            path = os.path.join(html_dir, "sections", slug + ".html")
            page_cache[slug] = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        html = page_cache[slug]
        block = extract_block(html, ref) if html else None
        if block:
            blocks[ref] = block
        else:
            missing.append(ref)
    return blocks, missing


def inline_css(html_dir):
    css = []
    for p in sorted(glob.glob(os.path.join(html_dir, "_astro", "*.css"))):
        css.append(open(p, encoding="utf-8").read())
    return "\n".join(css)


def js_safe(obj):
    """JSON for embedding inside a <script>. json.dumps escapes non-ASCII
    (incl. U+2028/U+2029) by default; we only need to neutralize </ so a value
    can't close the script element early."""
    return json.dumps(obj).replace("</", "<\/")


def build(db_path, html_dir, deck_view_path, out_path):
    deck = read_deck(db_path)
    blocks, missing = collect_blocks(deck, html_dir)
    css = inline_css(html_dir)
    deck_view = open(deck_view_path, encoding="utf-8").read()

    page = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        '<meta charset="utf-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
        "<title>App Router Guide — Deck</title>\n"
        "<style>\n" + css + "\n</style>\n</head>\n"
        '<body class="deck-view">\n'
        '<div id="deck-root" class="deck-stage"></div>\n'
        '<div id="deck-hud" class="deck-hud"></div>\n'
        "<script>window.__DECK__ = " + js_safe(deck) + ";\n"
        "window.__BLOCKS__ = " + js_safe(blocks) + ";</script>\n"
        "<script>\n" + deck_view + "\n</script>\n"
        "</body>\n</html>\n"
    )
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(page)

    n_slides = len(deck["slides"])
    n_items = sum(len(s["items"]) for s in deck["slides"])
    print(
        f"deck: {n_slides} slide(s), {n_items} item(s), {len(blocks)} block(s) inlined"
        + (f", {len(missing)} MISSING: {missing}" if missing else "")
        + f" -> {os.path.relpath(out_path, ROOT)}"
    )
    return out_path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", default=os.path.join(ROOT, "prisma", "notes.db"))
    ap.add_argument("--html-dir", default=os.path.join(ROOT, "build", "output", "app-router-guide_html"))
    ap.add_argument("--deck-view", default=os.path.join(ROOT, "public", "assets", "deck-view.js"))
    ap.add_argument("--out", default=os.path.join(ROOT, "build", "output", "app-router-guide-deck.html"))
    args = ap.parse_args()
    if not os.path.isdir(args.html_dir):
        sys.exit(f"error: built guide not found at {args.html_dir}; run `npm run build` first")
    build(args.db, args.html_dir, args.deck_view, args.out)


if __name__ == "__main__":
    main()
