import { createElement, type ReactNode } from 'react';
import type { AnySpec } from '../../src/lib/spec';
import type { ControlValues } from './Controls';

type Entry = {
  id: string;
  spec: AnySpec;
  module: Record<string, unknown>;
};

type Props = { entry: Entry; controls: ControlValues };

export function Preview({ entry, controls }: Props) {
  const Root = entry.module[entry.spec.reactName] as React.ComponentType<Record<string, unknown>> | undefined;
  if (!Root) {
    return <div className="empty">Component export `{entry.spec.reactName}` not found.</div>;
  }

  // Build children if the spec declares a compound child.
  const childSpec = entry.spec.composition?.children?.[0];
  const ChildCmp =
    childSpec && (entry.module[childSpec.component] as React.ComponentType<Record<string, unknown>> | undefined);

  const children: ReactNode | undefined = ChildCmp
    ? defaultChildrenFor(entry.spec.component, ChildCmp)
    : undefined;

  // Pre-select first child as defaultValue if applicable.
  const props = { ...controls };
  if (children && !('defaultValue' in props) && !('value' in props)) {
    props.defaultValue = 'overview';
  }
  if ('aria-label' in entry.spec.props === false) {
    props['aria-label'] = entry.spec.component;
  }

  return (
    <div className="preview-frame">
      {createElement(Root, props, children)}
    </div>
  );
}

// Tiny built-in demo content per known component. For now, hardcoded;
// future: derive from spec.composition.children examples.
function defaultChildrenFor(name: string, Child: React.ComponentType<Record<string, unknown>>): ReactNode {
  if (name === 'Tabs') {
    const items = ['overview', 'details', 'reviews', 'pricing', 'faq'];
    return items.map((v) =>
      createElement(Child, { key: v, value: v }, v.charAt(0).toUpperCase() + v.slice(1)),
    );
  }
  return null;
}
