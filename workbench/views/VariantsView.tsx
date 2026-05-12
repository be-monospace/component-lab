import { createElement } from 'react';
import type { Entry } from '../lib/render';
import {
  resolveModule,
  baseProps,
  defaultChildrenFor,
  findPrimaryVariantAxis,
} from '../lib/render';

type Props = { entry: Entry; controls: Record<string, unknown> };

/** Renders the component once per value of the primary variant axis.
 *  Falls back to a single render if no axis qualifies. */
export function VariantsView({ entry, controls }: Props) {
  const { Root, Child } = resolveModule(entry);
  if (!Root) return <div className="empty">Component not found.</div>;

  const axis = findPrimaryVariantAxis(entry.spec);
  if (!axis) {
    return (
      <div className="single-view">
        {createElement(
          Root,
          baseProps(entry.spec, controls),
          defaultChildrenFor(entry.spec.component, Child),
        )}
      </div>
    );
  }

  return (
    <div className="cells">
      {axis.values.map((v) => (
        <div className="cell" key={v}>
          <div className="cell-label">
            <code>{axis.name}</code> = <strong>{v}</strong>
          </div>
          <div className="cell-render">
            {createElement(
              Root,
              { ...baseProps(entry.spec, controls), [axis.name]: v },
              defaultChildrenFor(entry.spec.component, Child),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
