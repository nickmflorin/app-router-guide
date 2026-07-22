#!/usr/bin/env python3
"""
Populate slide titles in the deck DB. Titles are STORED (Slide.title); the deck
never derives titles at render time.

    python3 scripts/deck_titles.py           # list auto slides + suggested titles
    python3 scripts/deck_titles.py --apply    # write the suggestion into EMPTY auto slides
    npm run deck:titles -- --apply

Only slides with autoTitle on AND no title yet are filled (with the first
block's nearest heading, a sensible baseline). Manual slides (autoTitle off) and
slides that already have a title are never touched. Claude may overwrite any
auto title with a better one — that's just another write here — and it stays
until you ask to change it.
"""
import argparse
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def nearest_heading(html, content_id):
    m = re.search(r'data-content-id="' + re.escape(content_id) + r'"', html)
    if not m:
        return None
    before = html[: m.start()]
    heads = re.findall(r"<h[123][^>]*>(.*?)</h[123]>", before, re.S)
    if not heads:
        return None
    text = re.sub(r"<[^>]+>", "", heads[-1])
    return re.sub(r"\s+", " ", text).strip() or None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", default=os.path.join(ROOT, "prisma", "notes.db"))
    ap.add_argument("--html-dir", default=os.path.join(ROOT, "build", "output", "app-router-guide_html"))
    ap.add_argument("--apply", action="store_true", help="write suggestions into empty auto slides")
    args = ap.parse_args()

    if not os.path.exists(args.db):
        sys.exit(f"no DB at {args.db}")
    con = sqlite3.connect(args.db)
    try:
        rows = con.execute('select id, title, autoTitle, "order" from Slide order by "order"').fetchall()
    except sqlite3.OperationalError:
        print("no Slide table yet (run `npm run db:push`); nothing to title.")
        return

    page_cache = {}

    def read_page(slug):
        if slug not in page_cache:
            p = os.path.join(args.html_dir, "sections", slug + ".html")
            page_cache[slug] = open(p, encoding="utf-8").read() if os.path.exists(p) else None
        return page_cache[slug]

    changed = 0
    for sid, title, auto, order in rows:
        if not auto:
            continue  # manual title: never touch
        item = con.execute(
            'select contentRef from SlideItem where slideId=? and included=1 order by "order" limit 1',
            (sid,),
        ).fetchone()
        ref = item[0] if item else None
        suggestion = None
        if ref:
            html = read_page(ref.split("::")[0])
            if html:
                suggestion = nearest_heading(html, ref)
        tag = "has title" if (title or "").strip() else "EMPTY"
        print(f"  slide {order + 1} [{tag}] title={title!r}  suggestion={suggestion!r}")
        if args.apply and suggestion and not (title or "").strip():
            con.execute("update Slide set title=?, updatedAt=CURRENT_TIMESTAMP where id=?", (suggestion, sid))
            changed += 1
    if args.apply:
        con.commit()
        print(f"applied {changed} title(s).")
    else:
        print("(dry run; pass --apply to write empty auto slides)")
    con.close()


if __name__ == "__main__":
    main()
