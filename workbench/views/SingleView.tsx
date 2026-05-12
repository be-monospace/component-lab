import { createElement } from 'react';
import type { Entry } from '../lib/render';
import { resolveModule, baseProps, defaultChildrenFor } from '../lib/render';

type Props = { entry: Entry; controls: Record<string, unknown> };

export function SingleView({ entry, controls }: Props) {
  const { Root, Child } = resolveModule(entry);
  if (!Root) return <div className="empty">Component not found.</div>;
  return (
    <div className="single-view">
      {createElement(Root, baseProps(entry.spec, controls), defaultChildrenFor(entry.spec.component, Child))}
    </div>
  );
}
