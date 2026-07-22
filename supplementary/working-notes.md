# Working Notes

This document contains a checklist of content that should be added, modified, removed, or otherwise
improved in the App Router Guide. It is a work in progress and will be updated as the guide evolves.

Under no circumstances should anything in this document be automatically included in the guide until
I explicitly ask for it. This is a working document for me to keep track of what needs to be done,
and is not meant to be a comprehensive list of everything that needs to be done.

At each step of the way, if I ask you to explicitly tackle one of the items (or multiple items) in
this document, you should do so - and then follow back up by marking those items as completed in
this document. If you are unsure about whether or not to tackle an item, please ask me for
clarification before proceeding.

## Tentative (DO NOT AUTOMATICALLY ADDRESS ANYTHING IN THIS SECTION)

- [ ] Reducing dead whitespace, particularly in diagrams.
- [x] Diagrams or GIFs/references pointing to the video that shows Suspense as an analogy for
      version control. (Done 2026-07-19, explicitly requested: §10.1 got an "Under the hood"
      subsection with a four-frame git-graph diagram of the analogy and a caption crediting/linking
      Beyond React 16 (JSConf Iceland 2018) at the ~29min mark; a GIF isn't feasible in the
      SVG+markdown pipeline, so it's a multi-frame static diagram.)
- [ ] Do's and Don'ts Summaries for Each Page

## Ideas

- [ ] Working notes for Slide Deck.
- [ ] Productionizing working notes via API/ORM instead of JSON, use sqlite.
- [ ] Slide Deck "mode" to show what parts of the doc are in slide deck and allow me to select
      things or deselect things for inclusion or exclusion. Should be able to add notes as well, to
      existing selections or new selections, for inclusion in the slide deck. Will need a consistent
      store for this, either JSON file or sqlite per above.
- [ ] Slide Deck "mode" to fade all content not in the deck. Should be able to select things more
      granularly.
- [ ] Storing ongoing working notes that are not saved in local storage to prevent loss but
      persisting them via API on save. Removing the save to file option and should be able to open
      the modal for modifying the working note by clicking on the number. Notes at the top showing
      all notes unresolved as well as just the notes for that page. Ability to keep dialog open when
      hot refresh fires.
- [ ] Slide deck should reference common components for different chunks of page so its easier to
      keep them consistent.
- [ ] Maybe better leverage of subsections? Use subsections in the sidenav? Expand behavior so that
      opening a page automatically expands just that page's side nav sub headings but they can still
      be collapsed?
- [ ] Better treatment of examples as separate things, maybe use collapsable sections for them? Try
      to put them on the side?
