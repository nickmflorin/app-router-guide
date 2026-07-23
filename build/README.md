# The App Router Guide

The purpose of this guide is to help developers understand and effectively use both the App Router
and React 19 in their projects. The guide was originally built using Astro but this folder is a
distributable that the project builds to. The contents of this folder represent the various forms
that the guide is built in, including HTML and Markdown versions.

The content between HTML and `.md` versions is intended to be 1-1 equivalent. However, due to
complexities around the conversion of HTML/`.svg` diagrams in the HTML distributable forms ->
MermaidJS distributable forms in the `.md` formats, there may be slight differences in layout and
appearance.

## How this guide is intended to be used

The guide is, first and foremost, a document for humans. It is meant to be read end to end once,
then returned to as a reference: to look up a pattern when a question comes up in a PR, to explain a
concept during a design discussion or code review, and to give new team members a shared mental
model of how we build with the App Router and React 19. The **HTML distributables are by far the
easiest form for this**: they are styled, navigable, searchable, and render the guide's diagrams
exactly as authored. If you are a person reading this guide, use the HTML.

The Markdown distributables exist for a different audience: **automated tooling**. They are
deterministic translations of the HTML content, produced so the guide can be integrated with coding
agents, distilled into rule sets or instruction files, indexed for retrieval, and consumed by
anything else that speaks Markdown. Be warned that they are comparatively hard for a human to read:
the layout is flattened, long chapters run very long, and the Mermaid conversions of the diagrams
are functional rather than pretty. That is an accepted trade-off; human readability lives in the
HTML, and the Markdown's job is to make the same content easy to wire into agents.

One expectation worth setting: feeding the Markdown to an agent, or distilling it into rules, will
not produce a hardened rule set that needs no further attention. The guide is a thorough starting
point, not a finished policy; expect generated rules to need fine-tuning over time as they meet real
code and real edge cases. What the Markdown does provide is a solid base foundation for
incorporating these design patterns into automated code generation, and it is thorough enough that
the fine-tuning starts from substance rather than from scratch.

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

These forms exist primarily for automated consumption (see "How this guide is intended to be used"
above): agent integration, rule generation, retrieval. They are readable in a pinch, but they are
not the pleasant way to read the guide.

1. Single-File Bundled Markdown (`output/app-router-guide.md`): This is the entire guide as one
   Markdown document, ideal for handing to an agent as a single context source, or for places where
   Markdown is more useful than HTML (a repo, a wiki, a notes app).
2. Multi-Page Markdown (`output/app-router-guide_md/`): The guide as multi-page Markdown, one page
   per chapter. Start at `index.md` and follow the links between chapters. Works anywhere Markdown
   renders, e.g., dropped into a repository.

This folder contains the same guide in several forms; the content is identical across all of them.
As a rule of thumb: humans read the HTML, agents read the Markdown.

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
