---
name: audit-figma
description: Audit a Figma design system file against `docs/figma-setup-checklist.md` and produce a structured report of violations. Read-only — never modifies the Figma file. The output is a backlog of fixes a human (designer) applies manually. Triggers on phrases like "audit my Figma file", "check the Figma file against the checklist", "is my design system ready for code", "find issues in our Figma setup", or as a pre-handoff verification before code work starts.
---

# Audit a Figma file against the setup checklist

This skill walks a Figma design system file through every item in `docs/figma-setup-checklist.md` and produces a structured report. **Read-only** — no Figma edits. The agent identifies violations and proposes fixes; a human applies them.

The skill is the read-only sibling of the (not yet built) `setup-figma` skill. Use this when you want a backlog of what needs to change in the Figma file, not when you want the agent to change it for you.

## When to invoke

- User says "audit my Figma file" / "check Figma against the checklist" / "is the design system ready for code".
- Pre-handoff verification before starting a new component or batch.
- Periodically — e.g. after a Figma redesign sprint, before resuming code work.
- After establishing the design-system conventions, to baseline how far the current file is from them.

## Required reads (in order)

1. `docs/figma-setup-checklist.md` — the canonical rules. **You're checking against this.**
2. The Figma file's root via `get_metadata(figmaNodeId)` where `figmaNodeId` is the file or page node the user provides.
3. Token surface via `get_variable_defs` on the root.
4. If Supernova MCP is connected: `get_figma_component_list` for the full variant matrix and `get_documentation_page_list` for documentation coverage.

If the user doesn't provide a node ID, ask for one. Default scope is the entire file's design system page; the user can narrow.

## What this skill can check automatically vs. flag for human review

**Automated** (high confidence):
- Token name patterns — numeric-encoded names, doubled prefixes, inconsistent suffixes within a status family.
- Component name format — PascalCase, no spaces.
- Variant axis names and values — slug-friendly, code-prop-compatible.
- Documentation page sizes — flag if a page would overflow `get_design_context` (~30k chars).
- Cross-component naming coherence — find divergent status / size scales across components.
- Missing component-level tokens for shipped components — count of `--{component}-*` tokens per component.

**Requires human review** (mark in report; don't pretend to check):
- Component Description quality (intent vs. tautology).
- Whether every visual property in every layer is bound (auditing at layer level doesn't scale via MCP).
- Whether Mode names match the eventual CSS class names (CSS classes aren't in Figma).
- Whether an interaction-state axis is correctly modeled (semantic judgment).
- Anti-patterns that depend on intent (e.g. is `--badge-icon-color-positive` a coupling or a coincidence?).

Be honest in the report about which findings are mechanical and which the human still needs to verify.

## Workflow

### 1. Establish scope

Resolve the target Figma node:
- If the user gave a URL, parse `fileKey` and `nodeId`.
- If they gave a bare ID, use it.
- Otherwise, ask which file/page to audit.

### 2. Pull the file structure (one parallel batch)

```
get_metadata(nodeId)
get_variable_defs(nodeId)
get_figma_component_list()             # Supernova MCP, if connected
get_documentation_page_list()          # Supernova MCP, if connected
```

If the response would overflow, drill into specific component-set children one at a time.

### 3. Walk the checklist

For each section in `docs/figma-setup-checklist.md`, perform the relevant checks:

**§1 Token architecture** — read the variable defs. Group by inferred tier (primitives have raw values, semantics reference primitives, component tokens reference semantics). Flag if a tier appears empty or if components reference primitives directly.

**§2 Variable binding completeness** — sample a representative component (or all, if scope is small). For each layer, check if visual properties (fill, stroke, padding, gap, radius, typography) have variable bindings. Surface counts: "X of Y visual properties bound." Below ~90% → flag.

**§3 Theme system** — list the Mode names from Variable collections. Compare to expected CSS-class-friendly slugs (lowercase, hyphenated). Flag mismatches as "manual review: are these Mode names aligned with your CSS classes?"

**§4 Component organization** — for each component-set, check:
- Description field non-empty
- Description length 2+ sentences (not tautological)
- Component-set name PascalCase, no spaces

**§5 Variant axes** — for each component-set's variant properties:
- Axis name is PascalCase, single-word or short
- Values are slug-friendly
- Detect "interaction state" axes (values matching `Default | Hover | Focus | Pressed | Disabled`) and verify they're documented as state-only, not exposed as React props

**§6 Cross-component coherence** — enumerate all variant values across all components for likely shared concepts:
- All status / intent values: do they use the same scheme?
- All size values: same scheme?
- All state vocabulary: same words?

**§7 Naming conventions** — regex over all token names:
- Numeric-encoded names: `/\(\d+\)$/` or `/-\d+$/` paired with a non-numeric prefix that says the same thing differently
- Doubled prefixes: pattern `X-X-` at the start of a token group
- Inconsistent suffixes: cluster tokens by status word, flag clusters with multiple spellings

**§8 Documentation pages** — for each documentation page, estimate its `get_design_context` size. Flag pages >30k chars as likely to overflow.

**§9 Pre-handoff verification** — synthesize §1–§8 findings into a per-component pass/warn/fail table.

**§10 Anti-patterns** — explicit grep for each item in the checklist's §10 list.

### 4. Produce the report

Output format:

```
FIGMA AUDIT — <file name> · <date>

OVERALL: <pass | warn | fail> (<n> violations across <m> sections)

§1 Token architecture                  ✓ pass
§2 Variable binding completeness       ⚠ warn — 12 unbound properties
   - Tabs / Tab Item / Hover / icon — fill not bound (#262525)
   - Alert / Box / Neutral / dismiss — padding not bound
   - …
   Fix: bind each property to the appropriate semantic or component token.

§3 Theme system                        ⚠ manual review
   - Modes found: Default, Light, On Dark Green, On Green, On Grey
   - Verify these match your CSS class scheme (e.g. theme-default,
     theme-light, theme-on-dark-green). The agent can't see your CSS.

§4 Component organization              ✗ fail — 3 components without Description
   - Avatar — Description empty
   - Combobox — Description: "A combobox."
   - …

§5 Variant axes                        ✓ pass

§6 Cross-component coherence           ✗ fail — status names divergent
   - Badge uses: positive | negative | warning | informational
   - Alert uses: success | error | warning | informational | important
   - Pick one scheme; rename the other.

§7 Naming conventions                  ⚠ warn
   - Token `font-size/400 (16)` resolves to 17 — name encodes resolved value
   - Tokens prefixed `border-width/border-width/*` — doubled prefix
   - Status `informational` spelled as `information` in 2 tokens
     (--alert-icon-color-on-box-information, --alert-icon-color-on-header-information)

§8 Documentation pages                 ✓ pass

§9 Pre-handoff verification
   Component  | §1 | §2 | §4 | §5 | overall
   -----------|----|----|----|----|--------
   Tabs       | ✓  | ⚠  | ✓  | ✓  | ⚠
   Alert      | ✓  | ✗  | ✓  | ✓  | ✗
   Badge      | ✓  | ✓  | ✗  | ✓  | ⚠

§10 Anti-patterns flagged
   - Resolved values in token names: 23 tokens
   - Doubled prefixes: 47 tokens
   - Inconsistent suffixes: 2 tokens
   - Generic Description: 3 components

SUMMARY: 4 hard fails, 6 warnings, 2 manual-review items.
Suggested priority order: §6 (cross-component coherence), §4 (Descriptions),
§2 (binding completeness), §7 (naming).
```

### 5. Stop

The skill does not modify the Figma file. The user takes the report to a designer (or future `setup-figma` skill) for fixes.

## What to flag explicitly

- Items the API can't verify — be explicit that human review is needed.
- Findings that look intentional even if they violate a rule — note them; let the human confirm.
- Variable Modes whose names look ambiguous (e.g. spaces, mixed casing) — flag for manual mapping to CSS class names.
- Components where the variant axis count seems wrong (e.g. 0 axes — is this a real component? 10+ axes — is it overly complex?).

## What NOT to do

- **Don't modify the Figma file.** This is the read-only skill. If the user asks for fixes, point them at the (yet-to-build) `setup-figma` skill or to fixing manually.
- **Don't infer intent.** If a token name looks wrong but might be intentional, flag it for manual review; don't suggest a "fix" with high confidence.
- **Don't fabricate findings.** If the API doesn't expose enough to check an item (e.g. per-layer binding completeness across thousands of layers), say so. List that section as "limited check; manual audit recommended."
- **Don't grade on intent.** "Description: 'A button.'" should be reported as failing the §4 quality check, not interpreted charitably.
- **Don't be exhaustive.** If §2 has 200 unbound properties, list the first 10 and aggregate the rest. The report is a backlog, not a complete enumeration.

## Worked example

User: "Audit my Figma file. Node 1234:5678."

Agent reads `docs/figma-setup-checklist.md`. Pulls `get_metadata`, `get_variable_defs`, `get_figma_component_list`. Runs each section's checks. Produces the structured report above. Reports 4 hard fails (cross-component status divergence, 3 components without Descriptions, 12 unbound properties, doubled-prefix tokens) and 2 manual-review items (Mode names, intent-dependent anti-patterns). Stops. Suggests priority order. Doesn't modify anything.

The human takes the report to whoever maintains the Figma file. Once fixes are applied, re-run the skill — clean output means the file is ready for code work.

## How this relates to the code-side skills

This skill sits **upstream** of `draft-spec`, `implement-from-spec`, and `validate-spec`. The full picture:

```
audit-figma  →  (fixes applied in Figma)  →  draft-spec  →  (review)  →
implement-from-spec  →  (verification)  →  validate-spec  (ongoing)
```

When `validate-spec` later reports drift between a spec and Figma, the first question is whether Figma is correct. `audit-figma` is the answer to that question.
