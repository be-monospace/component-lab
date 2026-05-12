# component-lab

A spec-driven React component library **template** for agent-friendly design system implementation. Fork it, swap the tokens for yours, build your components.

## What you get

- A **three-tier token system** (primitives → semantics → component) with a light/dark seed in `src/tokens/`.
- **Typed component specs** (`<Name>.spec.ts`) that bind every component to its tokens, props, and accessibility contract. TypeScript enforces drift between the spec and the React component.
- **Three example components** — `Tabs`, `Alert`, `Badge` — implemented against the seed tokens. Use them as references; replace or extend with your own.
- **Layout primitives** — `Stack`, `Text`, `Icon` — token-driven, reusable.
- A built-in **workbench** at `npm run workbench` for previewing components: variants view, states view, matrix (variant × theme) view, controls, spec metadata, live token traces, raw JSON spec.
- A **playground** at `#/play` for sketching JSX without committing to a spec.
- **Four agent skills** under `.claude/skills/`:
  - `draft-spec` — read a Figma node, draft an annotated `<Name>.spec.ts` for human review.
  - `implement-from-spec` — produce `.tsx`, `.module.css`, `.test.tsx`, and `index.ts` from an approved spec.
  - `validate-spec` — read-only drift report between spec, component, tokens, and Figma.
  - `audit-figma` — read-only audit of a Figma file against `docs/figma-setup-checklist.md`.

## Stack

- TypeScript + React 18
- Plain CSS Modules (no styling library)
- CSS variables for tokens, with class-based theming
- Vite for the workbench, tsup for the library build
- Vitest + Testing Library for tests
- class-variance-authority for variant management

## Quickstart

```bash
npm install
npm run tokens:gen     # generate src/tokens/tokens.ts from the CSS files
npm run workbench      # workbench on http://localhost:4200
npm test               # vitest watch
```

## Scripts

| Command                  | What it does                                |
| ------------------------ | ------------------------------------------- |
| `npm run workbench`      | Vite-powered workbench, port 4200           |
| `npm test`               | Vitest watch                                |
| `npm run test:run`       | Vitest once (CI)                            |
| `npm run typecheck`      | TS no-emit                                  |
| `npm run lint`           | ESLint                                      |
| `npm run tokens:gen`     | Regenerate `tokens.ts` from `tokens/*.css`  |
| `npm run build`          | Build the library to `dist/`                |

## Make it yours

1. **Replace the tokens.** Drop your design system's CSS variables into `src/tokens/` — keep the four-file structure (`primitives.css`, `semantics.css`, `component.css`, plus theme overrides). Run `npm run tokens:gen`.
2. **Replace or extend the example components.** Delete what you don't need; keep `Tabs`/`Alert`/`Badge` as references.
3. **Update `package.json`** with your package name.
4. **Edit `CLAUDE.md`** to reflect any project-specific conventions.
5. **Use the agent skills.** Hand a Figma node URL to a Claude session in this repo and say *"draft a spec for X."* The agent reads `CLAUDE.md`, pulls the Figma context, and produces a reviewable spec file. After review, *"implement X from the spec."*

## Layout

```
src/
  components/<Name>/      # one folder per component
    <Name>.tsx
    <Name>.module.css
    <Name>.spec.ts        # typed contract
    <Name>.test.tsx
    index.ts
  primitives/             # Stack, Text, Icon
  tokens/                 # three-tier token system + theme overrides
    primitives.css
    semantics.css
    component.css
    dark.css
    index.css
    tokens.ts             # generated typed catalog
  lib/
    spec.ts               # spec schema (defineSpec)
    cn.ts
docs/
  figma-setup-checklist.md
workbench/                # Vite app, not shipped
.claude/skills/
  draft-spec/
  implement-from-spec/
  validate-spec/
  audit-figma/
```

## The spec-driven workflow

```
Figma ──> draft-spec ──> <Name>.spec.ts (review) ──> implement-from-spec ──> Component
                              │
                              ↓
                         Workbench (renders panels)
                              │
                              ↓
                         validate-spec (drift check)
                              │
                              ↓
                         *.spec.json (MCP / external tooling)
```

The spec is the hub. The skills are the automation.

See `CLAUDE.md` for the agent-facing rules and `docs/figma-setup-checklist.md` for the upstream Figma side.

## License

MIT.
