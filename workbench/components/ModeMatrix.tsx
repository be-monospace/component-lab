import { createElement, type ReactNode } from 'react';
import type { AnySpec } from '../../src/lib/spec';
import { COLOR_THEMES, type ColorTheme } from './ThemeSwitcher';
import type { ControlValues } from './Controls';

type Entry = { id: string; spec: AnySpec; module: Record<string, unknown> };

type Props = {
  entry: Entry;
  controls: ControlValues;
  density: string;
  breakpoint: string;
};

// Renders the component once per colour theme, isolated by a scoped wrapper
// that applies the theme classes locally.
export function ModeMatrix({ entry, controls, density, breakpoint }: Props) {
  const Root = entry.module[entry.spec.reactName] as React.ComponentType<Record<string, unknown>> | undefined;
  if (!Root) return null;

  const childSpec = entry.spec.composition?.children?.[0];
  const Child = childSpec && (entry.module[childSpec.component] as React.ComponentType<Record<string, unknown>>);

  return (
    <div className="matrix">
      {COLOR_THEMES.map((t) => (
        <ThemeCell key={t} color={t} density={density} breakpoint={breakpoint}>
          <header className="matrix-label">{t}</header>
          <div className="matrix-render">
            {createElement(
              Root,
              { ...controls, 'aria-label': entry.spec.component, defaultValue: 'overview' },
              defaultChildren(entry.spec.component, Child),
            )}
          </div>
        </ThemeCell>
      ))}
    </div>
  );
}

function ThemeCell({
  color,
  density,
  breakpoint,
  children,
}: {
  color: ColorTheme;
  density: string;
  breakpoint: string;
  children: ReactNode;
}) {
  // Locally-scoped theme wrapper — overrides CSS vars within this subtree.
  return (
    <div
      className={`matrix-cell theme-${color} theme-${density} theme-${breakpoint}`}
      style={{ background: 'var(--color-background-surface)' }}
    >
      {children}
    </div>
  );
}

function defaultChildren(
  name: string,
  Child: React.ComponentType<Record<string, unknown>> | undefined,
): ReactNode {
  if (!Child) return null;
  if (name === 'Tabs') {
    return ['overview', 'details', 'reviews'].map((v) =>
      createElement(Child, { key: v, value: v }, v.charAt(0).toUpperCase() + v.slice(1)),
    );
  }
  return null;
}
