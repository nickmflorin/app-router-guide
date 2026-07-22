---
paths:
  - '**/*.{ts,tsx,js,jsx,mjs,cjs}'
description: 'String literal quoting, line length, and wrapping'
---

<!-- Parity: keep in sync with .github/instructions/code/strings.instructions.md -->

# String Literals

## Source of Truth

The ESLint configuration is the authoritative definition of how strings are quoted and wrapped, and
all generated code must pass it. Before writing or restructuring a string, consult these config
files and abide by the rules they declare:

- `tooling/eslint-config-flat/configs/stylistic.mjs`: quote style and the `@stylistic/max-len` rule
- `tooling/eslint-config-flat/configs/base.mjs`: `no-multi-str` (no backslash line continuations)

If anything in this document ever conflicts with those configs, the ESLint configuration wins; treat
the divergence as a bug in this document and follow the linter.

## Quote Style

- Use single quotes (`@stylistic/quotes` set to `single`).
- Switch to double quotes only when doing so avoids escaping an inner single quote (`avoidEscape`),
  for example `"it's required"` rather than `'it\'s required'`.

## Line Length

A string must never push its line past the `@stylistic/max-len` limit of 100 characters. This holds
for every string in the codebase, including test `describe` and `it` names. No formatter wraps long
string literals automatically, so this is a manual edit, exactly like wrapping long comments.

When a string would exceed 100 characters:

- Split it across multiple lines and join the segments with the `+` operator. Never use a backslash
  line continuation; `no-multi-str` forbids it.
- Pack each segment as close to 100 characters as possible before breaking to the next, consistent
  with the comment line-length rule.
- Keep the separating space at the END of a segment, before the closing quote, so the words stay
  separated once the segments are concatenated.
- Template literals are also subject to `max-len` (`ignoreTemplateLiterals: false`); wrap the
  surrounding expression rather than let the line overflow. URLs are exempt (`ignoreUrls`).

```typescript
const message =
  'The submitted activity could not be routed to an evaluator because the selected reviewer ' +
  'is no longer assigned to the learner.';
```

## Test Names

`describe` and `it` titles are strings and follow the same rule: they must never exceed 100
characters, and must be split with `+` when they would. Place the title on its own argument lines:

```typescript
it(
  'returns a single-error result containing the message and the code-only extensions ' +
    'when called without an extensions arg',
  () => {
    // ...
  },
);
```

## Automation

Agents must apply this wrapping automatically while generating or editing code, and again as part of
the pull request process, so that no string ever lands over the limit.
