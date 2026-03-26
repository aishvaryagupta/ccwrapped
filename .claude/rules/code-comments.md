# Code Comment Rules

## When to Add Comments in Code

Only comment when the **logic itself** is non-obvious — not to explain design decisions, tradeoffs, or rationale.

| Situation                                                      | Where it goes      |
| -------------------------------------------------------------- | ------------------ |
| Non-obvious logic (e.g. a cancellation guard, a bitwise trick) | Code comment       |
| Forward-looking placeholder for a follow-up PR                 | `// TODO:` in code |
| Tradeoff explanation ("why not X")                             | PR comment         |
| Known limitation or architectural gap                          | PR comment         |
| Design rationale or "why we chose this approach"               | PR comment         |

## TODO Comments

Only add `// TODO:` when it is a genuine placeholder for code that **will be written in a follow-up PR**. Do not use TODOs to annotate known limitations, missing features with no scheduled work, or architectural gaps.

## Anti-Patterns

- Do not add multi-line comments explaining why a dev-only pattern is acceptable
- Do not document tradeoffs inline (e.g. "we use X not Y because...")
- Do not add "keep in sync" comments — if sync is required, enforce it at compile time instead
