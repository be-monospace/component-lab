# CLAUDE.md — component-lab

Read this before implementing any component. Rules here override defaults.

## What this repo is

A **template** for spec-driven React component libraries. Every component has a typed `<Name>.spec.ts` that's the contract between Figma (design source) and the React code. Tokens live in `src/tokens/` as plain CSS variables.

The repo ships with a small seed token system (primitives + semantics + component + dark theme) and three example components (`Tabs`, `Alert`, `Badge`). The seed is brand-agnostic — replace it with your design system's export when forking.

## The agent workflow

Four skills under `.claude/skills/` automate the loop:

| Skill | Phase | Output |
|---|---|---|
| `audit-figma` | Pre-handoff | Read-only audit of a Figma file against `docs/figma-setup-checklist.md` |
| `draft-spec` | Before code | Annotated `<Name>.spec.ts` — human reviews |
| `implement-from-spec` | After spec approval | `.tsx`, `.module.css`, `.test.tsx`, `index.ts` |
| `validate-spec` | Anytime / CI | Drift report between spec, code, tokens, Figma |

Read those skill files at `.claude/skills/<name>/SKILL.md` before doing any spec-related work.

## The per-component file layout

Every component lives in `src/components/<Name>/` and ships exactly five files:

```
src/components/<Name>/
  <Name>.tsx          # component(s), forwardRef, props from CVA
  <Name>.module.css   # styles, all values via var(--…)
  <Name>.spec.ts      # typed contract (Pick<Props, …> + tokens + a11y)
  <Name>.test.tsx     # behaviour tests
  index.ts            # re-exports component + spec
```

No stories, no MDX. The workbench reads the spec and renders everything else: live preview, controls, theme switcher, token trace, mode matrix.

## The spec (`<Name>.spec.ts`)

The single source of truth for "what is this component." Authored in TS so the type system enforces drift:

```ts
import { defineSpec } from '../../lib/spec';
import type { TabsProps } from './Tabs';

export default defineSpec<Pick<TabsProps, 'variant' | 'value' | 'defaultValue' | 'onValueChange'>>({
  component: 'Tabs',
  reactName: 'Tabs',
  import: '@component-lab/core',
  figmaNodeId: '1234:5678',
  description: '…',
  props: { … },                  // each typed; figma axis + map per prop
  figmaInternalAxes: [ … ],      // Figma axes that don't map to props (state)
  composition: { children: [ … ] },
  tokens: { background: [ … ] }, // typed against TokenName
  accessibility: { pattern, roleRoot, keyboard, requiredAttrs },
});
```

**What TS catches:**
- Rename a prop in `Tabs.tsx` → `Pick<TabsProps, …>` errors.
- Reference a non-existent token → `TokenName` union errors.
- Enum value doesn't match the React prop type → errors.

See [src/lib/spec.ts](src/lib/spec.ts) for the full schema and [src/components/Tabs/Tabs.spec.ts](src/components/Tabs/Tabs.spec.ts) for a real example.

## The token system

### Three tiers (always reference the highest available)

1. **Primitives** — `--gray-500`, `--blue-600`, `--space-6`. **Never reference in component code.**
2. **Semantics (decisions)** — `--color-text-default`, `--color-bg-info`, `--typography-body-md`. **Reference when no component-layer token exists.**
3. **Component** — `--tabs-bg-default`, `--alert-bg-info`, `--badge-icon-success`. **Reference whenever a component-layer token exists for the value you need.**

The component layer is the one that makes implementation mechanical. When `--tabs-bg-selected` exists as a pre-resolved token, the CSS writes itself. Add component tokens to `src/tokens/component.css` when you add a component.

### Theme system

Themes are CSS classes on `<body>` (or any ancestor). Seed ships with two:

| Class | What it overrides |
|---|---|
| `theme-light` (default) | Defined at `:root` in `primitives.css` / `semantics.css` / `component.css` |
| `theme-dark` | Defined in `dark.css`, overrides semantic + component tier values |

When you add more themes (brand variants, density, breakpoints, etc.), follow the same pattern: a new file with `.theme-X { … }` overriding semantic tokens.

### Token files

- `src/tokens/index.css` — top-level entry; `@import`s everything.
- `src/tokens/primitives.css` — raw values at `:root`.
- `src/tokens/semantics.css` — intent-based roles at `:root`.
- `src/tokens/component.css` — per-component resolved tokens at `:root`.
- `src/tokens/dark.css` — `.theme-dark { … }` overrides.
- `src/tokens/tokens.ts` — generated typed catalog. **Do not hand-edit.** Run `npm run tokens:gen`.

## Component conventions

### Props

- **CVA** for variants. Each Figma component property is one CVA variant.
- Default variants are explicit.
- `forwardRef<HTMLElement, Props>`.
- Extend native props via `Omit<ComponentPropsWithoutRef<…>, keyof OwnProps>`.

### Styles

- **CSS Modules only.** No inline styles for static values. Inline `style` only for:
  - Per-instance dynamic values (e.g. a `gap` resolving to a token reference, see `Stack`).
  - Composite `font` shorthand (see `Text`).
- Class names in `.module.css` are camelCase (`headingLg`).

### Primitives, not raw HTML

- **`<Stack>`** — every flex container. `direction | gap | padding | align | justify | wrap`. Spacing values: `none | xs | sm | md | lg | xl | 2xl | 3xl`.
- **`<Text>`** — every piece of text. `variant` maps to composite `--typography-*` tokens.
- **`<Icon name="…">`** — every icon. New icons go in `src/primitives/Icon/Icon.tsx`'s `PATHS` map.

### The `data-force-state` contract

Every component with interaction states (hover / focus / active / disabled) must support a workbench QA attribute that mirrors each pseudo-class. The workbench's "states" view sets this on the first interactive descendant to render states statically without user input.

In the component's CSS module, each interaction selector becomes an OR with the equivalent `data-force-state`:

```css
.tab:hover,                                /* real hover */
.tab[data-force-state='hover'] { … }       /* workbench QA */

.tab:focus-visible,
.tab[data-force-state='focus'] { … }

.tab:active,
.tab[data-force-state='active'] { … }

.tab[aria-disabled='true'],
.tab[data-force-state='disabled'] { … }
```

This is a one-line addition per interaction style. No JS changes. The component remains agnostic to the workbench.

### Accessibility

- Real semantic tags (`button`, `a`, `input`), never `<div onClick>`.
- Decorative icons → `aria-hidden`; meaningful → `label`.
- Keyboard-operable. Focus styles via `--color-border-focus` (or the component's own focus token).
- Test focus + keyboard behaviour in `.test.tsx`.

## Build & dev loop

| Task                | Command                    |
| ------------------- | -------------------------- |
| Workbench           | `npm run workbench` (port 4200) |
| Tests (watch)       | `npm test`                 |
| Tests (CI)          | `npm run test:run`         |
| Typecheck           | `npm run typecheck`        |
| Lint                | `npm run lint`             |
| Regenerate tokens   | `npm run tokens:gen`       |
| Build library       | `npm run build`            |

Before declaring a component done: `npm run typecheck && npm run lint && npm run test:run` must pass, and the workbench must render the component correctly across the available themes.

## Implementing from Figma — the workflow

1. **Pull the design.** `get_design_context` + `get_screenshot` + `get_variable_defs` on the Figma node.
2. **Draft the spec FIRST.** Invoke the `draft-spec` skill. It captures interpretation as a reviewable artefact.
3. **Review the spec.** Confirm prop names, defaults, token mappings, accessibility pattern.
4. **Implement against the spec.** Invoke `implement-from-spec`. Every prop in `<Name>.tsx` matches the spec; every `var(--…)` in `<Name>.module.css` is declared in `spec.tokens`.
5. **Validate in the workbench.** Variants view by default; flip theme; spot-check token trace.
6. **Run validation.** `validate-spec` for drift checks; `npm run typecheck && lint && test:run` for code health.

## What NOT to do

- Don't add a new styling library. Plain CSS Modules.
- Don't add a new icon package. Icons go in `Icon.tsx`'s `PATHS`.
- Don't introduce a new variant utility. CVA only.
- Don't write `<div style={{ display: 'flex' }}>`. Use `<Stack>`.
- Don't reference primitives in component CSS. Use semantic or component-tier tokens.
- Don't hand-edit `src/tokens/tokens.ts`. Run `npm run tokens:gen`.
- Don't write Storybook stories. The workbench replaces them.
- Don't author the spec for a component until the React props are stable.

## When in doubt

Read `src/components/Tabs/` end-to-end (component + spec + test). It's the canonical example.
