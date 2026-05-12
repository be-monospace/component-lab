# Setting up a Figma file for agent-driven code delivery

A checklist for preparing a design system in Figma so that downstream agents (or developers) can implement it in code with minimal interpretive work. Framework-agnostic: Tailwind, CSS Modules, vanilla CSS, styled-components — what changes is the syntax, not the structure.

The rules here are derived from real downstream failures: missing tokens, ambiguous prop axes, naming drift between sister components, documentation pages too large to consume, resolved values baked into token names. Every violation creates ambiguity the code agent has to resolve by guessing.

**Use this as a verification pass before declaring the Figma file "ready for code."** Equally suitable for a human designer or an AI agent operating on the file via the Figma Plugin API.

---

## The single principle

> Every visual decision is a bound, semantically-named Variable in a tier that reflects its scope.

If a designer can type a hex code into a fill or a number into a padding field, the system has failed at the Figma layer. The value arrives in code as a magic number the agent can't reason about.

---

## 1. Token architecture — three tiers, three Variable collections

- [ ] **Primitives** — a collection of raw values. Single mode. Never referenced directly by components.
  - Examples: `grey/500`, `accent/blue/600`, `dimension/space/16`
- [ ] **Semantics** — intent-based roles. References primitives via aliasing. **This is where theme Modes live.**
  - Examples: `color/text/default`, `color/feedback/positive/background`, `space/gap/regular`, `typography/body/medium-regular`
- [ ] **Component** — per-component resolved tokens. References semantics.
  - Examples: `button/background/default`, `button/label/color/on-fill`, `space/button/padding/regular`

**Why three tiers**: the component tier is what makes a code agent's job mechanical. When `--button-background-default` exists as a pre-resolved token, the CSS writes itself. When it doesn't, the code agent has to choose between several semantic tokens — and may choose wrong.

**Aim for full component-tier coverage on shipped components.** A component without its own tier of tokens is reusable only by interpretation.

---

## 2. Variable binding completeness

The high-leverage rule: every CSS-settable property is bound to a Variable.

- [ ] Colours — fills, strokes, text, icons
- [ ] Border widths
- [ ] Border radii
- [ ] Padding — each side or a single binding if all four are equal
- [ ] Gap — between flex/grid children
- [ ] Typography — composite Variable bundling family + size + weight + line-height + letter-spacing
- [ ] Shadows
- [ ] Opacity
- [ ] Icon sizes
- [ ] Component-level dimensions where they're fixed (e.g. avatar diameter, badge dot size)

A practical test: open any layer in your design and inspect the Properties panel. If any visual property shows a literal value rather than a Variable name, that property will arrive in code as a magic number.

---

## 3. Theme system — Modes, not separate variables

- [ ] Themes are Figma Variable **Modes**, not separate Variables. (e.g. `color/text/default` has different values per Mode, not three different variables.)
- [ ] **One axis per collection** (or at most one collection that mixes axes — but separate is cleaner). Common axes:
  - Colour theme: light, dark, branded variants
  - Density: regular, compact, generous
  - Breakpoint: small, medium, large
- [ ] Mode names should match the eventual CSS class names exactly:
  - Mode `On Dark Green` → CSS class `.theme-on-dark-green` (or whatever your naming scheme prescribes)
  - Don't have Mode `On Dark Green` mapping to CSS class `theme-ondarkgreen` — that mismatch propagates as confusion.
- [ ] Default mode = what should be active when no theme class is applied.

---

## 4. Component organization

- [ ] **One component-set per family.** All variants live in the same component-set; don't create `MinimalTab` and `SolidTab` as separate components.
- [ ] Variant property names map cleanly to code prop names. (See §5.)
- [ ] Each component-set has a **Description** filled in — 2–3 sentences covering: what it's for, when to use, when not to.
  - Bad: "A tab. Use it for tabs."
  - Good: "Tabbed navigation for switching between peer views. Use Minimal for content-area tabs and Solid for primary-emphasis nav. Avoid for binary toggles — use Switch."

---

## 5. Variant axes

Variant property names will become React (or equivalent) prop names. Pick them like an API designer, not like a designer describing a frame.

- [ ] **Axis names** are short, semantic, code-friendly:
  - Good: `Variant`, `Size`, `Status`, `Tone`
  - Bad: `Visual Style`, `How Big`, `Which Color`
- [ ] **Axis values** are slug-friendly:
  - Good: `Minimal | Solid`, `X-Small | Small | Regular | Large | X-Large`
  - Bad: `Tabs that are minimal`, `Sort of small`
- [ ] **Interaction states are a single axis** (typically `State`), with values `Default | Hover | Focus | Pressed | Disabled`. **These will NOT become React props** — they're handled by CSS pseudo-classes. They live in Figma for documentation only.
- [ ] **Boolean "has X" axes** map to prop presence, not boolean props:
  - Figma `Has Icon: true | false` → React prop `icon?: ReactNode` (presence = visible)
  - Figma `Has Dismiss: true | false` → React prop `onDismiss?: () => void` (presence = dismissible)

---

## 6. Cross-component coherence

The single biggest source of friction in mixed-component systems: same concept, different names. Pick **one** convention per concept and use it everywhere.

- [ ] **Status / intent naming** — one scheme across all components:
  - Either: `positive | negative | warning | informational`
  - Or: `success | error | warning | informational`
  - Don't mix. If Badge uses `positive/negative` and Alert uses `success/error`, the code-side API ends up inconsistent.
- [ ] **Size scales** — one scheme:
  - Either: `xs | sm | md | lg | xl`
  - Or: `x-small | small | regular | large | x-large`
- [ ] **State vocabulary** — align with WAI-ARIA where applicable:
  - `default | hover | focus | pressed | disabled` for interactive components
  - `selected` (not `active` or `current`) for the active-among-peers state
  - `expanded | collapsed` for disclosure components
- [ ] **Test for coherence**: list every status value across every component in one table. If the same concept appears under two names, fix one.

---

## 7. Naming conventions

- [ ] **Token names are semantic, not numeric**:
  - Good: `font-size/regular`, `space/padding/medium`
  - Bad: `font-size/400 (16)`, `space/padding/12`
  - Numeric-encoded names lie the moment a theme Mode changes the resolved value. (`font-size/400 (16)` resolving to 17px is a real example of this failure.)
- [ ] **No doubled prefixes** from nested groups:
  - Good: `border-width/regular`
  - Bad: `border-width/border-width/regular` (group named `border-width` containing a variable named `border-width-regular`)
- [ ] **Consistent suffixes within a status family**. If most tokens for "informational" status use `-informational`, don't have a couple that use `-information` (singular). This kind of typo propagates into every consumer that filters by status.
- [ ] **Path separators**: pick `/` or `-` and stick to it within the file. Figma uses `/` for grouping in the UI; the export tool typically converts to `-`.

---

## 8. Documentation pages

- [ ] One Figma page per component family.
- [ ] Each page contains:
  - The component description text (mirrors the component-set Description).
  - All variants visible at once (full variant matrix).
  - All interaction states represented, labeled.
  - All themes represented, labeled with names that match CSS class names.
  - Anti-patterns: 1–2 "don't do this" cases.
- [ ] **Page size budget**: ~30,000 characters or less in the serialised form. If `get_design_context` for the page overflows the agent's response, agents have to drill into individual variants and may miss the canonical view.
  - If a page would exceed this, split into anchor-addressable sections.

---

## 9. Pre-handoff verification

Before declaring a component "ready for code," verify:

- [ ] Every visual property in every variant is bound to a Variable.
- [ ] Component description is filled in (2–3 sentences of intent).
- [ ] Every interaction state is represented as a visual variant.
- [ ] Every variant property name is valid as a code prop name.
- [ ] Every variant value follows the system's naming scheme.
- [ ] Token names referenced by the component all exist in the Variable collections.
- [ ] No naming inconsistencies between this component and its siblings (status names, size scales).
- [ ] Documentation page exists for the component family.
- [ ] The component renders correctly in every theme Mode.

If any item fails, fix it in Figma before code work begins. Fixing token-system issues in code is roughly 5× more expensive than fixing them in Figma.

---

## 10. Anti-patterns we've seen break downstream

Each of these has bitten a real code agent during component implementation. Avoiding them is cheap; fixing them after the fact is not.

- **Resolved values baked into token names** — `font-size/400 (16)` whose value is actually `17`. The name says one thing; the value says another. Use semantic names (`font-size/regular`) and let the value be whatever the current Mode resolves.
- **Doubled prefixes** — `--border-width-border-width-regular` from a Figma group `border-width` containing a variable named `border-width-regular`. Flatten one level.
- **Inconsistent suffixes for the same status** — `informational` for most tokens, `information` (singular) for two. Every consumer that filters by status has to special-case the typo.
- **Missing component-tier typography** — a Figma text style exists (`Tab/Label/Default`) but didn't make it through to the token export as a single composite variable. Code has to compose from primitives.
- **Status axis values that don't match token suffixes** — Figma axis says `Negative` but the token is `--color-feedback-error-*`. The code agent has to choose which name to expose; both options are wrong in different ways.
- **Status names that diverge across components** — Badge uses `positive/negative`, Alert uses `success/error`. Both are reasonable individually; together they're an API inconsistency.
- **Documentation pages too large for MCP responses** — agent has to drill into individual variants and may miss the canonical view.
- **Component descriptions that are blank or generic** — "A button. Use it for buttons." The description is the only place intent lives; if it's empty, the agent makes intent up.
- **Visual properties typed directly instead of bound** — `2px` typed into a border-width field rather than referencing a Variable. Value arrives in code as a magic number.
- **Interaction states modeled as variant property values that the API exposes** — `state: 'hover'` should NOT be a React prop. Hover is the browser's job, not the component API's.

---

## For AI agents operating on a Figma file

If you're an AI agent setting up or modifying a Figma file:

1. Read this checklist before making structural changes.
2. Treat sections 1–8 as design decisions; sections 9–10 as verification steps.
3. **Report violations rather than silently working around them.** If a token doesn't exist for a value the design needs, surface that the token needs to be added — don't pick the closest existing one.
4. **The Description field on each component-set is the most under-used surface in Figma.** Filling it in well is the single highest-leverage thing a design agent can do.
5. When in doubt, prefer **explicit over clever** — three slightly redundant tokens beat one cleverly composed token that the downstream agent has to interpret.

---

## What this checklist deliberately doesn't cover

- **Specific colour palettes, type scales, or spacing scales.** Those are brand decisions; this checklist is about the architecture around them.
- **How to source icons.** Out of scope.
- **Figma plugins for exporting tokens.** Whatever toolchain you use (Tokens Studio, Supernova, custom), the rules in this checklist hold.
- **Code-side conventions** (CSS Modules vs Tailwind, etc.). Those are downstream of the design system, not part of it.

The principle behind every rule: **structured data the code agent can read, named consistently, with intent captured in prose where data can't carry it.** Everything else is consequence.
