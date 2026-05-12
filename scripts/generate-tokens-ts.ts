// Walks every src/tokens/*.css file (base + all themes), collects the union
// of `--token-name` declarations, and emits src/tokens/tokens.ts containing:
//   - a nested `tokens` object whose leaf values are `var(--…)` references,
//   - a `TokenName` union type of every variable name discovered.
//
// This is the bridge between Supernova's CSS-variable runtime (theming) and
// the TypeScript layer (autocomplete, typecheck, discoverability for codegen).
//
// Run via: npm run tokens:gen
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TOKENS_DIR = resolve(ROOT, 'src/tokens');
const TS_PATH = resolve(TOKENS_DIR, 'tokens.ts');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(TOKENS_DIR);
const seen = new Set<string>();
for (const file of files) {
  const css = readFileSync(file, 'utf8');
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:/gi)) {
    seen.add(m[1]!);
  }
}
const names = [...seen].sort();

type Tree = { [key: string]: Tree | string };

const tree: Tree = {};
for (const name of names) {
  const parts = name.split('-');
  let node = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (typeof node[key] === 'string' || node[key] === undefined) {
      node[key] = {};
    }
    node = node[key] as Tree;
  }
  const leaf = parts[parts.length - 1]!;
  if (typeof node[leaf] === 'object') {
    (node[leaf] as Tree)._self = `var(--${name})`;
  } else {
    node[leaf] = `var(--${name})`;
  }
}

function serialize(node: Tree | string, indent = 1): string {
  if (typeof node === 'string') return `'${node}'`;
  const pad = '  '.repeat(indent);
  const closePad = '  '.repeat(indent - 1);
  const entries = Object.entries(node).map(([k, v]) => {
    const key = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : `'${k}'`;
    return `${pad}${key}: ${serialize(v, indent + 1)},`;
  });
  return `{\n${entries.join('\n')}\n${closePad}}`;
}

const header = `// GENERATED FILE — do not edit by hand.
// Source: src/tokens/ (Supernova export, all .css files)
// Run \`npm run tokens:gen\` to regenerate.\n`;

const union = names.map((n) => `  | '${n}'`).join('\n');

const body = `${header}
export const tokens = ${serialize(tree)} as const;

export type TokenName =
${union};
`;

writeFileSync(TS_PATH, body, 'utf8');
console.log(`Wrote ${names.length} tokens from ${files.length} files to ${TS_PATH}`);
