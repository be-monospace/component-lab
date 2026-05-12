// Browser-side JSX evaluation for the playground.
//
// Lazy-loads @babel/standalone (~3 MB) on first use so the rest of the
// workbench stays light. Transforms user-typed JSX into createElement calls,
// then runs them against a scope that includes React + every library export
// + any common React hooks the user might reach for.
import * as React from 'react';
import * as Lib from '../../src';

export type EvalResult =
  | { ok: true; element: React.ReactElement }
  | { ok: false; error: string };

type BabelModule = {
  transform: (
    code: string,
    options: {
      presets: string[];
      filename?: string;
      parserOpts?: { allowReturnOutsideFunction?: boolean };
    },
  ) => { code: string | null | undefined };
};

let babelPromise: Promise<BabelModule> | null = null;
function loadBabel(): Promise<BabelModule> {
  if (!babelPromise) {
    babelPromise = import('@babel/standalone') as Promise<BabelModule>;
  }
  return babelPromise;
}

/** Eagerly start loading Babel so first eval is snappier. */
export function preloadBabel() {
  void loadBabel();
}

const SCOPE = {
  React,
  ...React, // useState, useEffect, useMemo, etc. — also spreads `default` (the React object itself), see filter below
  ...Lib, // Alert, Tabs, Tab, Stack, Text, Icon, Badge, cn — every library export
} as Record<string, unknown>;

// `new Function(...names, body)` rejects reserved-word parameter names. The
// `*` namespace import for `react` includes a `default` key (the React object
// itself is the module's default export); spreading it into SCOPE leaks that
// reserved word as an argument name and breaks the eval at parse time.
// Keep only valid, non-reserved identifiers.
const RESERVED = new Set([
  'default', 'class', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'throw', 'try', 'catch', 'finally',
  'new', 'this', 'super', 'typeof', 'instanceof', 'in', 'delete', 'void',
  'yield', 'async', 'await', 'enum', 'true', 'false', 'null', 'import',
  'export', 'extends', 'const', 'let', 'var',
]);
const SCOPE_NAMES = Object.keys(SCOPE).filter(
  (k) => !RESERVED.has(k) && /^[a-zA-Z_$][\w$]*$/.test(k),
);
const SCOPE_VALUES = SCOPE_NAMES.map((k) => SCOPE[k]);

export async function evalPlayground(userCode: string): Promise<EvalResult> {
  const trimmed = userCode.trim();
  if (!trimmed) {
    return { ok: false, error: 'Type some JSX above to render.' };
  }

  // Two writing styles are valid:
  //   1. A bare JSX expression: `<Alert />` — auto-wrapped in `return (...)`.
  //   2. Statements + an explicit `return` somewhere: function decls,
  //      const bindings, hooks, then `return <Whatever />;` at the end.
  //
  // We detect by the first non-whitespace character. If it's `<`, it's an
  // expression; anything else is treated as a function body where the user
  // owns the return.
  const isExpression = trimmed.startsWith('<') || trimmed.startsWith('(');
  const wrapped = isExpression ? `return (${trimmed});` : trimmed;

  let transformed: string;
  try {
    const Babel = await loadBabel();
    const result = Babel.transform(wrapped, {
      presets: ['react'],
      filename: 'play.jsx',
      // The wrapped source contains a top-level `return` — `new Function(body)`
      // resolves that at runtime, but Babel's parser checks it at transform
      // time and would otherwise refuse.
      parserOpts: { allowReturnOutsideFunction: true },
    });
    if (!result.code) throw new Error('Babel returned no code.');
    transformed = result.code;
  } catch (e) {
    return { ok: false, error: friendlyMessage('Syntax error', e) };
  }

  try {
    const fn = new Function(...SCOPE_NAMES, transformed) as (
      ...args: unknown[]
    ) => unknown;
    const element = fn(...SCOPE_VALUES);
    if (!React.isValidElement(element)) {
      return {
        ok: false,
        error:
          'Expression did not return a React element. Make sure your JSX is the last value (no trailing semicolons that drop the value).',
      };
    }
    return { ok: true, element };
  } catch (e) {
    return { ok: false, error: friendlyMessage('Runtime error', e) };
  }
}

function friendlyMessage(prefix: string, e: unknown): string {
  if (e instanceof Error) return `${prefix}: ${e.message}`;
  return `${prefix}: ${String(e)}`;
}
