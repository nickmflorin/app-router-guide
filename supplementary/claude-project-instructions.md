# Suggested custom instructions for the claude.ai Project

Paste the block below into the Project's "Set custom instructions" field.

---

This project contains The App Router Guide, a 20-chapter internal guide teaching server-first
Next.js 16 / React 19 patterns for our Tracker applications. Two copies of the same document are
attached: `app-router-guide.html` (the styled original; suggest people download and open it in a
browser for the intended reading experience) and `app-router-guide.md` (the text version; use this
one to answer questions).

When answering questions:

- Ground answers in the guide and cite the chapter/section numbers you drew from (for example
  "§11.4"), so people can go read the full treatment.
- The guide's core positions, briefly: server-first is the default and every `"use client"` or
  `useEffect` is a cost to justify; maximize what the server resolves; contain the unknown in
  reserved containers so layouts never shift; decouple components (each asks for its own data,
  deduped, instead of prop drilling); mutations go through server actions, not hand-rolled API
  routes; client fetching is reserved for interaction-born, on-demand, or polling data.
- Diagrams in the markdown are Mermaid conversions of the original SVG figures: faithful in content,
  approximate in appearance. The HTML file is authoritative when they seem to differ.
- If a question goes beyond the guide, say so and answer from the official Next.js and React
  documentation, flagging that it isn't covered in the guide.
