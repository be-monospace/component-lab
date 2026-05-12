---
name: draft-spec
description: Draft a typed component spec from a Figma node. Pulls design context, variable bindings, and the full variant matrix; produces an annotated `<Name>.spec.ts` for human review. Triggers on phrases like "draft a spec for X", "spec out the Y component", "start a new component from this Figma node", or any time the user provides a Figma URL/node-id and asks to begin a new component. Always read CLAUDE.md and src/lib/spec.ts before running. Stops at the spec file — never writes the React component as part of this skill.
---

# Draft a component spec from Figma

This skill captures the **interpretive** half of building a design system component. Its job is to produce one file — `src/components/<Name>/<Name>.spec.ts` — that crystallises every judgment call (prop names, defaults, token mappings, accessibility pattern, which Figma axes are props vs internal) into a reviewable artefact. **No React, CSS, or tests are written by this skill.** The user reviews the spec; once approved, the `implement-from-spec` skill takes over.

## When to invoke

- User provides a Figma URL or node ID and asks to start a new component.
- User says "draft a spec for [Name]" / "spec out [Name]" / "create a spec from this Figma".
- User wants to begin component work — anything that comes before component code.

If the user asks to "implement" or "build" a component, this skill still runs first (drafts the spec) but should explicitly stop and surface the draft before continuing.

## Required reads (in this order, before any other work)

1. `CLAUDE.md` at repo root — house conventions, token rules, what NOT to do.
2. `src/lib/spec.ts` — the `Spec<P>` schema you'll emit against.
3. One existing spec as precedent — `src/components/Tabs/Tabs.spec.ts` or `src/components/Alert/Alert.spec.ts`. Match its shape.
4. `src/tokens/tokens.ts` — confirm the `TokenName` union exists. Don't read in full (1700+ lines); just confirm it's there. Use `grep` for specific token lookups during the draft.

If any of these reads fail, stop and report — the repo isn't set up correctly.

## Workflow

### 1. Parse the Figma reference

Accept either:
- A full URL: `https://figma.com/design/:fileKey/:fileName?node-id=1-2` → extract `fileKey` and node ID.
- A bare node ID: `1234:5678` or `1234-5678` → use as-is (Figma MCP handles both forms).

### 2. Pull Figma context — in parallel

```
mcp__Figma__get_design_context(nodeId)
mcp__Figma__get_variable_defs(nodeId)
mcp__Figma__get_screenshot(nodeId)
mcp__Figma__get_metadata(nodeId)
```

If `get_design_context` overflows (typical for documentation pages), drill into a single variant instance node and re-fetch.

If the Supernova MCP is connected, also fetch `get_figma_component_list` once per session to access the full variant matrix for the component family. Filter to the component you're drafting.

### 3. Map Figma Variables → repo tokens

`get_variable_defs` returns a flat dictionary of Figma Variables touching the subtree. For each entry:

- Convert the name: slashes → hyphens, camelCase → lowercase, e.g. `tabs/border/color/default` → `tabs-border-color-default`.
- Confirm the token exists in the export:

```bash
grep -E "^  --tabs-border-color-default:" src/tokens/base/*.css
```

- If found, add to the appropriate category in `spec.tokens` (background / border / headline / copy / icon / space / typography).
- If not found, flag in a `// FLAG:` comment in the spec. Don't invent the token; report it.

### 4. Identify the variant axes

From `get_design_context` (the TypeScript prop blob it returns) and from the variant family in `get_figma_component_list`:

- **Prop axes** — properties whose values the React API exposes. Example: `Variant=Minimal|Solid` → `variant: 'minimal' | 'solid'`.
- **Internal axes** — properties that exist in Figma for documentation but are interaction-driven (handled by CSS pseudo-classes) or derived state. Example: `State=Default|Hover|Focus|Disabled`, `Is Selected=true|false`. These go in `figmaInternalAxes`, not `props`.

**Naming convention** for the prop side:
- Prop names: lowercase camelCase (`variant`, `isSelected`, `onDismiss`)
- Enum values: lowercase, hyphenated where multi-word (`minimal`, `x-large`, `informational`)
- Boolean props for "Has X" axes: name them after their effect (`Has dismiss` → `onDismiss` callback presence, not a `dismissible: boolean`)

### 5. Identify the WAI-ARIA pattern

Pick the closest match to the component category:

| Component type | Pattern | roleRoot | Keyboard |
|---|---|---|---|
| Tabs / segmented nav | WAI-ARIA Tabs | `tablist` | Arrow keys, Home/End |
| Alert / notification | WAI-ARIA Status / Alert | `status` (or `alert` for errors) | Tab to dismiss button |
| Modal / dialog | WAI-ARIA Dialog | `dialog` | Escape closes, focus trap |
| Combobox / autocomplete | WAI-ARIA Combobox | `combobox` | Arrow keys, Enter, Escape |
| Menu | WAI-ARIA Menu | `menu` / `menuitem` | Arrow keys, Enter |
| Button | (native) | `button` | Space/Enter |
| Toggle / switch | WAI-ARIA Switch | `switch` | Space |
| Checkbox / radio | (native) | `checkbox` / `radio` | Space |

If the component doesn't match any of these, flag the uncertainty and propose what makes sense semantically.

### 6. Compose the spec file

Use `Record<string, unknown>` as the generic parameter — the React component doesn't exist yet, so `Pick<Props, …>` would fail. Add a comment explaining the placeholder will be tightened post-implementation.

Annotate every interpretive decision with markers so the reviewer can scan to where judgment was applied:

- `[DERIVED]` — mechanically pulled from a structured source (Figma variable map, variant matrix, well-known a11y pattern).
- `[DRAFT]` — agent generated it; reviewer should polish (e.g. the description).
- `[PROPOSED]` — agent chose between valid options; reviewer should confirm (e.g. prop naming when conventions differ).

Example for a placeholder generic:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Draft = Record<string, any>;

export default defineSpec<Draft>({ ... });
```

### 7. Write the file

Path: `src/components/<Name>/<Name>.spec.ts`.

**Verify `figmaNodeId` and `figmaUrl` point at the same node before writing.** Convert the node ID's colon to a dash for the URL's `node-id=` query parameter: `'6616:4436'` ↔ `?node-id=6616-4436`. The implementation skill uses the URL to validate the spec is still in sync with Figma; if they disagree, downstream drift detection will fire on a spec that was never internally consistent.

**Do NOT create `<Name>/index.ts`** — that would cause the workbench's registry to auto-discover the spec and try to render a component that doesn't exist yet. Leave the folder with just the spec file until implementation runs.

### 8. Stop and present

Surface to the user:

- Path of the written spec.
- Summary table: prop count, token count, accessibility pattern.
- **Every `[DRAFT]` and `[PROPOSED]` marker** with the specific decision needing confirmation.
- **Every `// FLAG:` comment** — missing tokens, naming inconsistencies, ambiguous axes.
- One sentence per non-obvious judgment call (e.g. "I treated `State` as internal, not a prop, because state should be interaction-driven via CSS pseudo-classes.").
- A clear next-step: "Approve and I'll run `implement-from-spec`."

**Do not implement the component as part of this skill, even if the user's original prompt asked for the full build.** The hand-off is the whole point.

## What to flag explicitly

- Tokens referenced in Figma that don't exist in `src/tokens/`.
- Token naming inconsistencies (e.g. `information` vs `informational` for the same status).
- Composite typography styles from Figma that have no `--typography-*` equivalent in the export.
- Figma variant property names that don't fit React idiom and need translation.
- Figma axes where you can't decide if they're props or internal — surface both interpretations.
- Default values that aren't explicit in Figma (you propose; reviewer confirms).
- Missing component-layer tokens — flag, don't invent.

## What NOT to do

- Don't write the React component, CSS module, or tests.
- Don't create `index.ts` for the component folder.
- Don't read 1700-line files (`tokens.ts`) end-to-end. Use grep for specific lookups.
- Don't invent tokens that don't exist in the export. Flag.
- Don't translate Figma axis names silently. If `Status` becomes `intent`, surface the choice for review.
- Don't make the spec "complete" by adding fields that don't trace to a source. Every field should come from Figma, the schema, or an explicit `[PROPOSED]` judgment.
- Don't proceed past the human review checkpoint.

## Worked example

User: "Draft a spec for Alert from https://figma.com/design/.../Alert?node-id=5159-7087"

Agent reads CLAUDE.md, spec.ts, Tabs.spec.ts. Pulls Figma context (design + variables + screenshot + metadata). Maps `alert/box/background/padding/left-and-right` → confirms `--space-alert-box-background-padding-left-and-right` exists in `src/tokens/base/space.css`. Identifies `Variant: Box|Header`, `Status: Neutral|Informational|Success|Warning|Error|Important` as prop axes. Picks WAI-ARIA Status / Alert pattern with `role="status"` (or `role="alert"` for error). Writes `src/components/Alert/Alert.spec.ts` with all decisions marked. Surfaces three flags: (1) token typo `information` vs `informational`, (2) status names use `error/success` (not `negative/positive`) to match exported tokens, (3) three React-idiomatic props (`icon`, `actions`, `children`) without Figma axes that may or may not need spec entries.

Stops. Waits for approval.
