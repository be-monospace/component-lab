// Spec schema for design system components.
// Authored in TS; the type system enforces:
//   - prop names match the actual React component props (via Pick<>)
//   - token references exist in the Supernova export (via TokenName union)
//   - enum values match what the prop accepts
import type { TokenName } from '../tokens/tokens';

export type Spec<P extends Record<string, unknown>> = {
  /** Figma-facing component name. */
  component: string;
  /** Code-facing React component name. Usually identical to `component`. */
  reactName: string;
  /** npm package import path. */
  import: string;
  /** Figma node id for round-tripping (e.g. "11202:52402"). */
  figmaNodeId?: string;
  /** 1–2 sentence intent; what the component does and when to use it. */
  description: string;

  /** Typed prop map. Keys must be keys of the React component's prop type. */
  props: { [K in keyof P]: PropSpec<P[K]> };

  /**
   * Figma variant axes that DON'T translate to React props.
   * Typically interaction states (Hover, Focus, Disabled) handled by CSS,
   * or derived states (Is Selected) inferred at runtime.
   */
  figmaInternalAxes?: string[];

  composition?: {
    children?: ChildSpec[];
  };

  /** Categorised list of design tokens the component consumes. Type-checked against tokens.ts. */
  tokens?: Record<string, TokenName[]>;

  accessibility?: AccessibilitySpec;

  /** Link to the canonical docs page (Supernova, Notion, etc.). */
  docsUrl?: string;
  /** Direct deep-link to the Figma component. */
  figmaUrl?: string;
};

export type PropSpec<T> = {
  type: 'enum' | 'string' | 'boolean' | 'number' | 'callback' | 'node';
  description?: string;
  default?: T;
  required?: boolean;
  /** For enum props: the allowed values, as literal strings. */
  values?: readonly string[];
  /** Mapping back to the Figma variant axis. `axis: null` = no Figma counterpart. */
  figma?: {
    axis: string | null;
    map?: Record<string, string>;
  };
};

export type ChildSpec = {
  /** Component name as exported from the library. */
  component: string;
  /** WAI-ARIA role this child implements. */
  role?: string;
};

export type AccessibilitySpec = {
  /** Named WAI-ARIA pattern (e.g. "WAI-ARIA Tabs"). */
  pattern?: string;
  /** Root element role. */
  roleRoot?: string;
  /** Item element role for compound components. */
  roleItem?: string;
  /** Keystroke → behaviour map. */
  keyboard?: Record<string, string>;
  /** ARIA attributes the component must emit. */
  requiredAttrs?: string[];
};

/**
 * Identity helper. Constrains the spec to the React component's props.
 *
 * Usage:
 *   import type { TabsProps } from './Tabs';
 *   export default defineSpec<Pick<TabsProps, 'variant' | 'value'>>({ ... });
 */
export function defineSpec<P extends Record<string, unknown>>(spec: Spec<P>): Spec<P> {
  return spec;
}

/** Type-erased shape used by registry / workbench consumers. */
export type AnySpec = Spec<Record<string, unknown>>;
