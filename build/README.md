# The App Router Guide

This folder contains the same guide in several forms. Pick whichever suits how you want to read it;
the content is identical across all of them.

## The forms

- **`output/app-router-guide.html`** - the entire guide as one file. The simplest way to read it:
  double-click the file and it opens in your browser. Nothing to install, no other files needed.

- **`output/app-router-guide_html/`** - the guide as a multi-page site, one page per chapter. Open
  `index.html` in your browser and navigate with the sidebar (it includes search). Keep the folder
  together as-is; the pages share the assets inside it.

- **`output/app-router-guide.md`** - the entire guide as one Markdown document, for places where
  Markdown is more useful than HTML (a repo, a wiki, a notes app). Open it in any Markdown viewer or
  editor.

- **`output/app-router-guide_md/`** - the guide as multi-page Markdown: start at `index.md` (it has
  a table of contents) and follow the links between chapters. Works anywhere Markdown renders, e.g.
  dropped into a repository.

## One note on diagrams

The HTML forms contain the guide's original diagrams. In the Markdown forms, those diagrams are
converted to Mermaid charts. The conversion is not perfect: Mermaid lays things out its own way, so
proportions, positioning, and some visual detail differ from the originals, and a few diagrams don't
translate at all (you'll find a comment describing what the figure shows in their place). The
Mermaid versions are viewable and genuinely useful, especially for automated agents consuming the
Markdown, but they are not direct one-to-one translations. When a diagram's exact layout matters,
treat the HTML forms as the authoritative rendering.
