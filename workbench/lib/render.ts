// Shared helpers for rendering library components from a registry entry.
import { createElement, type ReactNode } from 'react';
import type { AnySpec, PropSpec } from '../../src/lib/spec';

export type Entry = {
  id: string;
  spec: AnySpec;
  module: Record<string, unknown>;
};

/** The "primary variant axis" — the enum prop with a declared default and
 *  more than one value. This is what we stack in variants view. */
export function findPrimaryVariantAxis(spec: AnySpec): {
  name: string;
  values: readonly string[];
  prop: PropSpec<unknown>;
} | null {
  for (const [name, prop] of Object.entries(spec.props)) {
    if (
      prop.type === 'enum' &&
      Array.isArray(prop.values) &&
      prop.values.length > 1 &&
      prop.default !== undefined
    ) {
      return { name, values: prop.values, prop };
    }
  }
  return null;
}

/** Standard children injected per component name. Until specs grow their own
 *  "example children" field, this map covers the demos. */
export function defaultChildrenFor(
  componentName: string,
  Child: React.ComponentType<Record<string, unknown>> | undefined,
): ReactNode {
  if (!Child) return null;
  if (componentName === 'Tabs') {
    return ['overview', 'details', 'reviews', 'pricing'].map((v) =>
      createElement(Child, { key: v, value: v }, v.charAt(0).toUpperCase() + v.slice(1)),
    );
  }
  return null;
}

/** Per-component demo content for non-prop slots (children, etc).
 *  Folded into the rendered output by views. */
export function defaultContentFor(componentName: string): Record<string, unknown> {
  if (componentName === 'Alert') {
    return {
      title: 'A side note',
      children: 'The connection to the server has been interrupted. Please try again.',
    };
  }
  return {};
}

/** Resolves the component constructor and the child constructor (if any). */
export function resolveModule(entry: Entry) {
  const Root = entry.module[entry.spec.reactName] as
    | React.ComponentType<Record<string, unknown>>
    | undefined;
  const childSpec = entry.spec.composition?.children?.[0];
  const Child = childSpec
    ? (entry.module[childSpec.component] as
        | React.ComponentType<Record<string, unknown>>
        | undefined)
    : undefined;
  return { Root, Child, childSpec };
}

/** A safe set of default props every component can accept harmlessly. */
export function baseProps(spec: AnySpec, controls: Record<string, unknown>) {
  const props: Record<string, unknown> = { ...controls, ...defaultContentFor(spec.component) };
  if (spec.component === 'Tabs') {
    if (!('aria-label' in props)) props['aria-label'] = spec.component;
    if (!('value' in props) && !('defaultValue' in props)) props.defaultValue = 'overview';
  }
  return props;
}
