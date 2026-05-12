---
name: implement-from-spec
description: Implement a React component, CSS module, tests, and barrel export from an approved `<Name>.spec.ts` file. Treats the spec as a contract — every prop, token, and accessibility requirement in the spec must be reflected in the code, and no code should reference tokens not in the spec. Triggers on phrases like "implement Alert from spec", "build the component from the spec", "now write the code", or any time the user signals the spec is approved and the agent should produce the implementation. Requires a `<Name>.spec.ts` to already exist; if it doesn't, run the `draft-spec` skill first.
---

# Implement a component from its approved spec

This skill is the **mechanical** half of the spec-driven workflow. Once the spec exists, this skill produces:

- `<Name>.tsx` — React component matching the spec's prop signature.
- `<Name>.module.css` — styles using only tokens declared in `spec.tokens`.
- `<Name>.test.tsx` — Vitest behavioural tests covering everything in `spec.accessibility`.
- `<Name>/index.ts` — barrel export for component + spec.
- Updates to `src/index.ts` to re-export the public surface.
- Updates to `<Name>.spec.ts` to tighten the generic from `Record<string, unknown>` to `Pick<<Name>Props, …>`.

It also runs `typecheck`, `lint`, and `test:run` before reporting done.

## When to invoke

- User says "implement [component] from the spec" / "build it" / "now write the code".
- User has approved a draft spec (the previous turn was a `draft-spec` output).
- A `<Name>.spec.ts` file exists in `src/components/<Name>/` but `<Name>.tsx` does not.

If the spec doesn't exist yet, don't run this — run `draft-spec` instead.

## Required reads

1. `CLAUDE.md` — token rules, primitive conventions, what NOT to do.
2. The spec file: `src/components/<Name>/<Name>.spec.ts`.
3. One existing component as a structural precedent. Use `Tabs` for compound (parent + child) components, `Alert` for single-component shapes.
4. `src/lib/spec.ts` if you need to reference the schema.

## Workflow

### 1. Read the spec and verify pre-conditions

- Confirm every token in `spec.tokens.*` resolves in `src/tokens/`:
  ```bash
  grep -E "^  --<token-name>:" src/tokens/base/*.css
  ```
  If a token is missing, stop and surface — implementing with phantom tokens silently breaks runtime. Suggest the user either fix the token export or remove the entry from the spec.
- Note any `// FLAG:` comments in the spec. These usually describe known token quirks the implementation must handle (e.g. typo'd variant names).

### 2. Write `<Name>.tsx`

Conventions (all enforced by CLAUDE.md):

- Use `forwardRef<HTMLElement, Props>`.
- Props type matches `spec.props` exactly. Names, types, defaults — no deviation. Use `as const` on enum value arrays to preserve literal types.
- Defaults are explicit in the function signature, not buried in CVA.
- Extend native props via `Omit<ComponentPropsWithoutRef<…>, keyof Own | 'role' | 'aria-*'>` for anything the component owns.
- Compose with `<Stack>`, `<Text>`, `<Icon>` — never raw `<div>` flex layouts, never `<p>` for component text, never inline `<svg>`.
- Implement accessibility per `spec.accessibility`:
  - `role` and `aria-live` (or whatever's in `spec.accessibility.requiredAttrs`) set on the root.
  - Keyboard handlers for every entry in `spec.accessibility.keyboard`.
  - Roving tabindex / focus management if the pattern requires it.
- For interactive children, support the `data-force-state` contract — but the logic for setting `data-force-state` lives in the workbench's StatesView, not in the component. The component just needs CSS for it.

### 3. Write `<Name>.module.css`

- Use only tokens declared in `spec.tokens`. If you need a token not in the spec, stop and update the spec first.
- Reference component-layer tokens (`--<name>-*`, `--space-<name>-*`) wherever they exist. Fall back to semantic (`--color-*`, `--space-*`) only if no component-layer token covers the use case.
- For each interaction state in the design (`hover`, `focus`, `active`, `disabled`), write the real pseudo-class selector AND the `[data-force-state='X']` equivalent in one selector list:
  ```css
  .tab:hover,
  .tab[data-force-state='hover'] { background: var(--tabs-background-hover); }
  ```
- Class names in camelCase (`headingLg`), not kebab-case. CSS Modules conventions.
- No template-string class lookups in TSX (`styles[\`size-${s}\`]`). Use explicit map or CVA.

### 4. Write `<Name>.test.tsx`

Vitest + Testing Library. Behavioural, not snapshot.

Tests to write, derived mechanically from the spec:

- **Renders** — one test confirms basic render + accessible name.
- **Each `spec.accessibility.requiredAttrs`** — one test per attribute that confirms it's emitted (including its correct value for the component's default state).
- **Each `spec.accessibility.keyboard` entry** — one test per keystroke that confirms the documented behaviour.
- **Each `spec.props.*.default`** — confirm the default is applied when the prop is omitted.
- **Each callback prop** (`onDismiss`, `onValueChange`, etc.) — confirm it fires on the documented trigger.
- **Disabled / non-interactive states** — confirm they suppress the relevant handlers (e.g. clicking a disabled tab doesn't change selection).

Use `user-event` for interactions, not `fireEvent`.

### 5. Tighten the spec's generic

After `<Name>.tsx` exists, edit `<Name>.spec.ts`:

```ts
// Before:
type Draft = Record<string, any>;
export default defineSpec<Draft>({ ... });

// After:
import type { <Name>Props } from './<Name>';
export default defineSpec<Pick<<Name>Props, '<prop1>' | '<prop2>' | ...>>({ ... });
```

Pick exactly the props the spec describes — usually a subset of `<Name>Props` (excluding native-passthrough props like `className`).

Also remove the `[DRAFT]` / `[PROPOSED]` / `[DERIVED]` annotation comments from the spec body. They were for the review step; once shipped, they're noise. Keep `// FLAG:` comments — those describe ongoing token-system issues.

### 6. Create `<Name>/index.ts`

```ts
export { <Name>, type <Name>Props, type <Name>Variant, type <Name>Status } from './<Name>';
export { default as spec } from './<Name>.spec';
```

Export types for every public enum / shape the component exposes. The `spec` re-export is what the workbench registry discovers.

### 7. Update `src/index.ts`

Add the component's public exports (component + prop types). Keep alphabetical or import-block order — match what's there.

### 8. Run the verification trio

```bash
npm run typecheck
npm run lint
npm run test:run
```

If any of these fail, fix the underlying issue and re-run. **Do not skip lint or use `--max-warnings 1`.** The component isn't done until all three pass.

### 9. Report

Surface to the user:

- Files created (paths only).
- Test count (e.g. "7 tests pass").
- Tokens referenced (count, matches spec).
- Any spec items that required compromise during implementation (e.g. "spec said `--typography-tabs-label` should drive label type; that token doesn't exist in the export, so I composed from `--font-family-body` + `--font-size-400` + `--font-weight-regular` and added a FLAG comment to revisit").
- Any new icons added to the `Icon` registry (if applicable).

## What to flag explicitly

- A token in `spec.tokens` that doesn't exist in `tokens.ts` — stop, ask the user to fix the spec or the export.
- A spec contradiction (e.g. `figma.axis: null` but the prop has a `figma.map`) — stop and ask.
- A WAI-ARIA pattern in `spec.accessibility` that the component can't realistically implement with the proposed prop shape — surface and propose an alternative.
- A figma-internal axis that you suspect should actually be a prop (or vice versa) — implement what the spec says, but flag the disagreement.

## What NOT to do

- Don't deviate from `spec.props`. Every prop in the spec must exist; no extra props beyond native passthrough; no renames.
- Don't reference tokens not in `spec.tokens`. If you need one, update the spec first.
- Don't add components to `Icon`'s `PATHS` registry unless the spec implies icons that don't exist yet. If you do add, surface the icon names you added in the report.
- Don't write stories, MDX, or workbench-specific glue. The workbench discovers via `index.ts`; the implement skill stops at that boundary.
- Don't introduce new variant utilities, styling libraries, or third-party deps. CVA + CSS Modules + cn helper. That's it.
- Don't mock anything in tests. Behavioural tests against real DOM.
- Don't merge or skip the verification trio. Three commands must pass.

## Worked example

User: "Implement Alert from the spec."

Agent reads CLAUDE.md, Alert.spec.ts, Tabs.tsx (precedent). Confirms every `--alert-*` token exists in `tokens.ts`. Writes Alert.tsx (composes Stack + Text + Icon + dismiss button; emits `role="status"` or `role="alert"` based on `status` prop; supports `data-force-state` on dismiss button via CSS). Writes Alert.module.css (one selector per status × variant combination, real and force-state hover/focus/disabled). Writes Alert.test.tsx (6 tests: renders, error role, dismiss button presence + click, icon override, actions slot). Tightens spec generic to `Pick<AlertProps, 'variant' | 'status' | 'title' | 'onDismiss'>`. Creates index.ts. Updates src/index.ts. Runs typecheck + lint + test:run — all pass. Reports: 5 files, 6 tests, no new icons, two FLAG comments retained (token typo + missing typography composite).
