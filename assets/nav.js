/* Shared navigation — single source of truth for the TOC.
   Each page has <div id="sidebar"></div> and <div id="pager"></div>;
   this script renders both based on the current filename. */

const TOC = [
  { part: null, items: [
    { n: "1",  title: "Introduction",              file: "01-introduction.html" },
    { n: "2",  title: "The Goals",                 file: "02-goals.html" },
    { n: "3",  title: "The Mental Model",          file: "03-mental-model.html" },
  ]},
  { part: "Part A — Maximize the Known", items: [
    { n: "4",  title: "Client/Server Boundaries",  file: "04-client-server-boundaries.html" },
    { n: "5",  title: "First-Render JavaScript",   file: "05-first-render-js.html" },
    { n: "6",  title: "Server-Resolvable State",   file: "06-server-resolvable-state.html" },
  ]},
  { part: "Part B — Contain the Unknown", items: [
    { n: "7",  title: "Containers & Content Shifting", file: "07-containers-content-shifting.html" },
    { n: "8",  title: "Suspense & Streaming",      file: "08-suspense-streaming.html" },
    { n: "9",  title: "Blocking Requests",         file: "09-blocking-requests.html" },
  ]},
  { part: "Part C — Decouple the Parts", items: [
    { n: "10", title: "Minimize the Wires",        file: "10-minimize-the-wires.html" },
    { n: "11", title: "Dedupe & Caching",          file: "11-dedupe-caching.html" },
    { n: "12", title: "Component Breakdown",       file: "12-component-breakdown.html" },
  ]},
  { part: "Part D — Applied", items: [
    { n: "13", title: "Worked Example",            file: "13-worked-example.html" },
    { n: "14", title: "Signs You're Doing It Wrong", file: "14-signs-doing-it-wrong.html" },
    { n: "15", title: "Applied to recraft",        file: "15-applied-to-recraft.html" },
  ]},
  { part: "Appendix", items: [
    { n: "16", title: "New Primitives",            file: "16-new-primitives.html" },
    { n: "17", title: "References",                file: "17-references.html" },
  ]},
];

/* IDE-style code wrapping. Each pre.code is split into one div per source line;
   every line gets padding-left equal to its own indentation (plus a 2ch wrap
   offset) and an equal negative text-indent. Unwrapped lines render exactly as
   authored; wrapped continuation lines hang at the line's indentation, the way
   VS Code renders soft wraps. Done here because CSS's `text-indent: each-line`
   is not yet supported in Chrome. */
(function () {
  /* 0 replicates VS Code's default wrappingIndent: "same" — continuations
     align exactly at the line's own leading whitespace. */
  const WRAP_OFFSET = 0;
  document.querySelectorAll("pre.code").forEach((pre) => {
    const lines = [];
    let line = document.createElement("div");
    line.className = "code-line";
    const breakLine = () => {
      lines.push(line);
      line = document.createElement("div");
      line.className = "code-line";
    };
    const addSplit = (text, makeNode) => {
      text.split("\n").forEach((part, i) => {
        if (i > 0) breakLine();
        if (part) line.appendChild(makeNode(part));
      });
    };
    let filename = null;
    Array.from(pre.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        addSplit(node.textContent, (t) => document.createTextNode(t));
      } else if (node.classList && node.classList.contains("filename")) {
        filename = node;
      } else if (node.textContent.includes("\n") && node.children.length === 0) {
        addSplit(node.textContent, (t) => {
          const s = node.cloneNode(false);
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
    lines.forEach((l) => {
      const text = l.textContent;
      const lead = (text.match(/^ */) || [""])[0].length;
      const body = text.slice(lead);
      /* Comment openers hang their wraps where the comment TEXT starts, so
         soft wraps line up with the comment's authored continuation lines.
         Code lines hang at their own indentation (VS Code's "same"). */
      let hang = lead + WRAP_OFFSET;
      if (body.startsWith("{/*")) hang = lead + 4;
      else if (body.startsWith("/*")) hang = lead + 3;
      else if (body.startsWith("//")) hang = lead + 3;
      const indent = text.trim() ? hang : 0;
      l.style.paddingLeft = indent + "ch";
      l.style.textIndent = -indent + "ch";
      pre.appendChild(l);
    });
  });
})();

(function () {
  const here = location.pathname.split("/").pop();
  const inSections = location.pathname.includes("/sections/");
  const prefix = inSections ? "" : "sections/";
  const homeHref = inSections ? "../index.html" : "index.html";

  const flat = TOC.flatMap(g => g.items);
  const idx = flat.findIndex(i => i.file === here);

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    const assetPrefix = inSections ? "../" : "";
    let html = `<a class="brand" href="${homeHref}"><img class="mark" src="${assetPrefix}assets/logomark.svg" alt="Craft Education"> App Router Guide</a>
      <div class="brand-sub">Craft Education &middot; Next.js 16 / React 19</div>`;
    for (const group of TOC) {
      if (group.part) html += `<div class="part-label">${group.part}</div>`;
      for (const item of group.items) {
        const cls = item.file === here ? "toc-item current" : "toc-item";
        html += `<a class="${cls}" href="${prefix}${item.file}"><span class="n">${item.n}</span>${item.title}</a>`;
      }
    }
    sidebar.innerHTML = html;
  }

  const pager = document.getElementById("pager");
  if (pager && idx !== -1) {
    const prev = flat[idx - 1], next = flat[idx + 1];
    let html = "";
    html += prev
      ? `<a href="${prefix}${prev.file}"><span class="dir">&larr; Previous</span><span class="title">${prev.n}. ${prev.title}</span></a>`
      : `<span style="flex:1"></span>`;
    html += next
      ? `<a class="next" href="${prefix}${next.file}"><span class="dir">Next &rarr;</span><span class="title">${next.n}. ${next.title}</span></a>`
      : `<span style="flex:1"></span>`;
    pager.className = "pager";
    pager.innerHTML = html;
  }
})();
