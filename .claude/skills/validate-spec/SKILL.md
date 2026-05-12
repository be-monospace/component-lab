---
name: validate-spec
description: Check that a component spec is in sync with the React component, the CSS module, the token export, and the Figma component. Reports drift with specific suggested patches; does NOT modify files. Triggers on phrases like "validate the spec for X", "check for drift", "is the Y spec still accurate?", "run spec validation", or as part of CI / pre-merge checks. This is read-only — it reports, the human (or `update-spec` skill) acts.
---

# Validate a component spec against code, tokens, and Figma

This skill detects four kinds of drift:

1. **Spec ↔ React component** — prop names, prop types, enum values.
2. **Spec ↔ component CSS** — tokens used in CSS that aren't in `spec.tokens`, and vice versa.
3. **Spec ↔ token export** — tokens declared in spec that no longer exist in `src/tokens/`.
4. **Spec ↔ Figma** — variant axes the spec claims exist that Figma no longer has (renamed, removed) or that Figma has and the spec doesn't cover.

It produces a structured report. **It does not modify any file.** If the user wants the spec patched, that's a separate ask.

## When to invoke

- User says "validate Alert" / "check for drift" / "is the spec accurate" / "run spec validation".
- As part of CI before merging — if a script wraps this skill into a `npm run validate:specs` command.
- After a Figma redesign — to surface what specs need updating.
- After a token export change — to surface what specs reference missing tokens.

## Required reads

1. `src/components/<Name>/<Name>.spec.ts` — the spec under inspection.
2. `src/components/<Name>/<Name>.tsx` — the React component.
3. `src/components/<Name>/<Name>.module.css` — the styles.
4. `src/tokens/tokens.ts` — the current `TokenName` union (for token existence checks).
5. `CLAUDE.md` — to know what conventions to check against.

If the user asks to validate all specs at once, repeat the workflow for every `src/components/*/<Name>.spec.ts`.

## Workflow

### 1. Spec ↔ React component

Read the React component's exported props type (`<Name>Props`).

For each entry in `spec.props`:

- **Prop existence.** Confirm the prop name exists in the component's prop type. If not → drift: "Spec declares `<prop>` but component has no such prop."
- **Enum values.** If the spec prop has `values: [...]`, confirm the component accepts exactly those values (no more, no fewer). If the component accepts a superset → drift: "Component accepts `<extra-value>` but spec doesn't declare it." If the component accepts a subset → drift: "Spec declares `<missing-value>` but the component doesn't accept it."
- **Default value.** If the spec prop has `default`, confirm the component's default (in the function signature or `defaultVariants`) matches. If different → drift.

Conversely, for each prop in the component's prop type:

- If the prop is not in `spec.props` AND it's not a passthrough prop (`className`, `style`, `id`, `aria-*`, `data-*`, native HTML event handlers) → drift: "Component has prop `<name>` that spec doesn't describe."

### 2. Spec ↔ component CSS

Read `<Name>.module.css` and extract every `var(--…)` reference.

For each token used in CSS:

- If the token name isn't in any `spec.tokens.*` array → drift: "CSS uses `--<token>` but spec doesn't declare it." Suggest adding to the appropriate category.

For each token declared in `spec.tokens.*`:

- If the token name isn't referenced anywhere in the CSS → drift: "Spec declares `--<token>` but CSS doesn't use it." Suggest pruning unless it's used by JS (rare).

Exclude tokens that are JS-referenced (workbench parses CSS to resolve them; the spec uses them for the trace panel even if not directly in this component's CSS). Reserve this exclusion for explicit cases; default behaviour is to flag.

### 3. Spec ↔ token export

For each token in `spec.tokens.*`:

- Check that the token name appears in `src/tokens/tokens.ts` (the `TokenName` union or generated object).
- Quickest check: grep the actual token CSS files:
  ```bash
  grep -hE "^  --<token-name>:" src/tokens/base/*.css
  ```
- If not found → drift: "Spec references `--<token>` which no longer exists in the token export."

This is the most actionable kind of drift — it means the token system changed under the component and the component is currently rendering with a fallback (or worse, with `inherit`).

### 4. Spec ↔ Figma

Read `spec.figmaNodeId`. Pull current Figma context:

```
mcp__Figma__get_design_context(spec.figmaNodeId)
mcp__Figma__get_metadata(spec.figmaNodeId)
```

For each prop in `spec.props` with `figma.axis !== null`:

- Confirm the axis name exists in the Figma component's current variant property set.
- If the prop has `figma.map`, confirm each Figma value (the map's keys) exists in the current Figma axis values. Surface any Figma values not in the map (new variants that aren't covered).

If Figma has variant axes that the spec doesn't cover (and they're not interaction states / in `figmaInternalAxes`) → drift: "Figma has axis `<X>` that spec doesn't address."

If the Figma node ID returns 404 or "not found" → drift: "Figma node has been deleted or moved. Update `figmaNodeId` or remove."

### 5. Report

Output structure:

```
COMPONENT: Alert
SPEC: src/components/Alert/Alert.spec.ts

✓ Spec ↔ React: in sync (4 props, all match)
✗ Spec ↔ CSS:
   - CSS uses `--alert-extra-border` (not in spec.tokens.border). Suggested patch:
     add `'alert-extra-border'` to spec.tokens.border.
✓ Spec ↔ tokens: in sync (all 56 tokens resolve)
✗ Spec ↔ Figma:
   - Spec prop `status` has Figma value `Negative` in its map. Figma now uses
     `Error`. Suggested patch: spec.props.status.figma.map = { ...,
     Error: 'error' } (drop `Negative: …`).
   - Figma has new axis `Has Actions` that spec doesn't cover. Decide:
     prop or internal axis?

OVERALL: 2 drift items (1 in CSS, 1 in Figma)
```

For multiple specs (validate-all), summarise at the end:

```
14 specs checked
12 in sync ✓
 2 with drift ✗
   - Alert: 2 items
   - Combobox: 1 item
```

## What this skill does NOT do

- **No modifications.** Read-only. Even when suggesting patches, the patch is in the report, not applied.
- **No spec re-drafting.** If a spec is fundamentally wrong, that's an `update-spec` job (not yet built).
- **No code fixes.** If the component's prop type is wrong relative to the spec, this skill doesn't decide which is canonical — it reports the diff and lets the human pick.
- **No new specs.** If a component exists without a spec, this skill flags the absence but doesn't draft.

## What to flag explicitly

- Components without specs.
- Specs whose `figmaNodeId` returns 404.
- Tokens referenced in a spec but missing from the export.
- Figma axes added since the spec was authored.
- Props in the component that aren't in the spec (potential undocumented surface).
- Token coverage mismatches in either direction.

## Exit conditions

- Clean: every check passes. Report "OVERALL: in sync."
- Drift: at least one mismatch. Report each with location, severity (info / warn / block), and suggested patch.
- Error: cannot reach Figma, cannot read a file, malformed spec. Report as a block.

The skill does not return a non-zero exit code — that's a wrapping script's job. The skill just produces the report.
