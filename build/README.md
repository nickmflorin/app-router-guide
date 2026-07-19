# The App Router Guide

The purpose of this guide is to help developers understand and effectively use both the App Router
and React 19 in their projects. The guide was originally built using Astro but this folder is a
distributable that the project builds to. The contents of this folder represent the various forms
that the guide is built in, including HTML and Markdown versions.

The content between HTML and `.md` versions is intended to be 1-1 equivalent. However, due to
complexities around the conversion of HTML/`.svg` diagrams in the HTML distributable forms ->
MermaidJS distributable forms in the `.md` formats, there may be slight differences in layout and
appearance.

In the `output/` folder, you will find all the distributable forms of the guide. These are as
follows:

> For a better understanding of what this guide discusses, you should open it/view it and read the
> foundational sections of the guide first.

## HTML Distributables

When viewing the documentation and guide, is highly recommended that the HTML distributable forms be
used to view the guide in your web browser. They provide the most digestible and accurate
representation of the content and layout, as the content is rendered in a way to make it easy to
find, read, navigate, and interact with.

1. Single-File Bundled HTML (`output/app-router-guide.html`): This is the entire guide, along with
   its styles and other assets, bundled into a single HTML file for convenience. This is the easiest
   to view and distribute as it is self-contained and can be opened directly in your web browser.
2. Multi-Page HTML (`output/app-router-guide_html/`): The guide as a multi-page site, one page per
   chapter. Open `index.html` in your browser and navigate with the sidebar (it includes search).
   Keep the folder together as-is; the pages share the assets inside it.

Note that regardless of whether or not you open the `output/app-router-guide.html` (single-file
bundled output) or the `output/app-router-guide_html/` (multi-page HTML) version, the content is the
same and there are no behavioral differences.

## Markdown Distributables

1. Single-File Bundled Markdown (`output/app-router-guide.md`): This is the entire guide as one
   Markdown document, for places where Markdown is more useful than HTML (a repo, a wiki, a notes
   app). Open it in any Markdown viewer or editor.
2. Multi-Page Markdown (`output/app-router-guide_md/`): The guide as multi-page Markdown, one page
   per chapter. Start at `index.md` and follow the links between chapters. Works anywhere Markdown
   renders, e.g., dropped into a repository.

This folder contains the same guide in several forms. Pick whichever suits how you want to read it;
the content is identical across all of them.

## Additional Note on Distributables

The distributables are provided in multiple formats to cater to different use cases and preferences.
HTML is ideal for interactive viewing in a web browser, while Markdown is suitable for editing,
version control, and integration with other Markdown-based tools.

The HTML forms contain the guide's original diagrams. In the Markdown forms, those diagrams are
converted to Mermaid charts. The conversion is not perfect: Mermaid lays things out its own way, so
proportions, positioning, and some visual detail differ from the originals, and a few diagrams don't
translate at all (you'll find a comment describing what the figure shows in their place). The
Mermaid versions are viewable and genuinely useful, especially for automated agents consuming the
Markdown, but they are not direct one-to-one translations. When a diagram's exact layout matters,
treat the HTML forms as the authoritative rendering.
