# Claude — start here

Read the context doc before doing anything. It is the repo map, the dev/build rules, the two
dev-only tooling systems (page notes + slide deck), the database workflow, the build/verify gate,
and the parallel-work protocol.

@CONTEXT.md

`PROJECT.md` holds the longer history and decisions log (read it when you need the "why"); it is not
imported here to keep sessions light.

## Non-negotiables

- **Commit as Nick:**
  `git -c user.name="Nick Florin" -c user.email="nick.florin@crafteducation.com" commit`
- **Run the build/verify gate before committing** (see CONTEXT.md): `npm run build` must exit 0 and
  strip the dev layer; `python3 scripts/svg_lint.py` must be `CLEAN.`; keep every `<Diagram>`'s
  Mermaid twin in sync.
- **Parallel work goes in a git worktree — but never create a branch or worktree without asking
  first.** Don't assume parallelism. Lightweight edits (a quick single file, read-only tasks, a note
  resolution, a DB-only change) can stay in the main tree.
- **Edit the SQLite DB (`prisma/notes.db`) with Python's stdlib `sqlite3`** for notes/deck changes
  (no Prisma in the sandbox); the app uses Prisma at runtime.
- Keep new tooling inside the dev-only paths so `astro build` strips it.
