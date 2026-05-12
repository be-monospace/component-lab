// Builds the alias chain for a CSS custom property:
//   --tabs-background-selected
//     → var(--color-action-background-selected)
//     → var(--color-action-primary-selected)
//     → var(--accent-green-500)
//     → #00b663
//
// Strategy:
//   1. Bundle every base/<theme>/*.css text via Vite's raw imports.
//   2. Parse a flat { name -> rawValue } map for each scope.
//   3. To trace `--x`, look up its rawValue. If it's `var(--y)`, recurse.
//      Stop when the rawValue is no longer a var() reference (literal value).
//
// Only base/ is parsed for the static chain; runtime resolution from the
// current theme classes still works via getComputedStyle for the leaf value.

// Vite raw imports — all base tokens, concatenated.
const baseRaw = import.meta.glob('../../src/tokens/base/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function parseVars(css: string): Map<string, string> {
  const out = new Map<string, string>();
  // Match `--name: value;` declarations. Values can include var(), commas, etc.
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out.set(m[1]!, m[2]!.trim());
  }
  return out;
}

const baseVars = new Map<string, string>();
for (const css of Object.values(baseRaw)) {
  for (const [k, v] of parseVars(css)) {
    // Last-write-wins matches CSS cascade ordering within the base files.
    baseVars.set(k, v);
  }
}

export type TraceStep = {
  name: string;        // token name, no leading --
  rawValue: string;    // as written in CSS
  /** True if this step is a literal value (hex, rgb, px, font shorthand, etc). */
  isLiteral: boolean;
};

const VAR_REF = /^var\(--([a-z0-9-]+)\s*(?:,\s*[^)]*)?\)$/i;

export function traceToken(tokenName: string, max = 8): TraceStep[] {
  const steps: TraceStep[] = [];
  let current = tokenName;
  for (let i = 0; i < max; i++) {
    const raw = baseVars.get(current);
    if (raw === undefined) {
      steps.push({ name: current, rawValue: '(not in base)', isLiteral: true });
      break;
    }
    const m = raw.match(VAR_REF);
    if (m) {
      steps.push({ name: current, rawValue: raw, isLiteral: false });
      current = m[1]!;
    } else {
      steps.push({ name: current, rawValue: raw, isLiteral: true });
      break;
    }
  }
  return steps;
}

/** Live-resolved value from the currently themed DOM. */
export function getResolvedValue(tokenName: string, scope: Element = document.body): string {
  return getComputedStyle(scope).getPropertyValue(`--${tokenName}`).trim();
}
