---
paths:
  - '**/*.{ts,tsx,js,jsx,mjs,cjs}'
description: 'String literal quoting, line length, and wrapping'
---

<!-- Parity: keep in sync with .github/instructions/code/strings.instructions.md -->

# String Literals

## Quote Style

- Use single quotes.
- Switch to double quotes only when doing so avoids escaping an inner single quote (`avoidEscape`),
  for example `"it's required"` rather than `'it\'s required'`.

## Line Length

A string must never push its line past the hard limit of 100 characters. This holds for every string
in the codebase, including test `describe` and `it` names. No formatter wraps long string literals
automatically, so this is a manual edit, exactly like wrapping long comments.

When a string would exceed 100 characters:

- Split it across multiple lines and join the segments with the `+` operator. Never use a backslash
  line continuation;
- Pack each segment as close to 100 characters as possible before breaking to the next, consistent
  with the comment line-length rule.
- Keep the separating space at the END of a segment, before the closing quote, so the words stay
  separated once the segments are concatenated.
- Template literals are also subject to the hard limit of 100 characters; wrap the surrounding
  expression rather than let the line overflow. URLs are exempt.

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
