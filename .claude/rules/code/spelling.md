---
paths:
  - '**/*.{ts,tsx,js,jsx,mjs,cjs,md,mdx}'
description: 'Resolving cspell spell-check flags in generated code and docs'
---

<!-- Parity: keep in sync with .github/instructions/code/spelling.instructions.md -->

# Spelling (cspell)

Spelling is checked by cspell, configured in `cspell.config.mjs`, with a project-specific word list
in `craft-dictionary.txt` (lowercase, one word per line; the dictionary is configured with
`addWords: true`). When generating or editing code or documentation, proactively resolve any word
that cspell would flag rather than leaving it for later. For each flagged word, take exactly one of
the three actions below, chosen by what the word actually is.

## 1. Genuine Misspelling: Fix It

If the flagged word is an obvious misspelling of a real word (a typo), correct the spelling in
place. This is the default and most common case.

## 2. Correctly Spelled Domain Term: Add It to the Dictionary

If the word is spelled correctly but is a real project, product, library, or domain term that is
simply absent from the English dictionary and `craft-dictionary.txt`, add it to
`craft-dictionary.txt` as a new lowercase entry on its own line. cspell matches case-insensitively,
so a single lowercase entry covers every casing of the word.

A strong signal that a flagged word belongs in the dictionary is repetition. If the same word
appears several times in a file (for example `spdd` referenced six times), the flag almost certainly
reflects a missing dictionary entry rather than a mistake. Add it once and every occurrence across
the codebase is covered.

## 3. Intentional Non-Word: Disable the Line

If the text is intentionally not a real word, such as deliberate gibberish, an encoded value, or a
fragment that is part of a regular expression or pattern, suppress it with a disable directive on
the line directly above it:

```typescript
// cspell:disable-next-line
const redactedSample = 'jdoe@exmpl.tst tok_abc123xyz';
```

In Markdown, use the HTML-comment form on the preceding line:

```markdown
<!-- cspell:disable-next-line -->
```

Prefer `cspell:disable-next-line` over a broad `cspell:disable` block, and never disable spell
checking for a whole file to hide a single word.

## Choosing Between Adding and Disabling

- A legitimate term that could appear again anywhere belongs in the dictionary (case 2).
- One-off noise tied to a specific line (a regex, an encoded blob, fixture gibberish) is disabled on
  that line (case 3).

When in doubt between the two, prefer adding to the dictionary if the word is a real term that may
recur, and prefer a line disable only when the content is genuinely a one-off non-word.
