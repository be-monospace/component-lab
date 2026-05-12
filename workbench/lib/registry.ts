// Auto-discovers components by globbing every `*.spec.ts` under src/components.
// The matching `index.ts` next to the spec re-exports both the component
// and its spec as `spec`, so we can load them in one go.
import type { ComponentType } from 'react';
import type { AnySpec } from '../../src/lib/spec';

type Entry = {
  id: string;          // slug derived from spec.component, e.g. "tabs"
  spec: AnySpec;
  module: Record<string, ComponentType<unknown> | unknown>;
};

// Vite-only glob import. `eager: true` resolves synchronously at build/dev start.
const modules = import.meta.glob('../../src/components/*/index.ts', { eager: true }) as Record<
  string,
  { spec: AnySpec } & Record<string, ComponentType<unknown> | unknown>
>;

export const registry: Entry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const { spec, ...rest } = mod;
    const id = spec.component.toLowerCase();
    return { id, spec, module: rest, _path: path };
  })
  .sort((a, b) => a.spec.component.localeCompare(b.spec.component));

export function findById(id: string | null): Entry | undefined {
  if (!id) return undefined;
  return registry.find((e) => e.id === id);
}
