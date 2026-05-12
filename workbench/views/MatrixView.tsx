import { createElement } from 'react';
import type { Entry } from '../lib/render';
import {
  resolveModule,
  baseProps,
  defaultChildrenFor,
  findPrimaryVariantAxis,
} from '../lib/render';
import { COLOR_THEMES } from '../components/ThemeSwitcher';

type Props = {
  entry: Entry;
  controls: Record<string, unknown>;
};

/** Full grid: primary variant axis × colour theme. Each cell scopes its own
 *  theme classes so the consumed DS tokens resolve locally. */
export function MatrixView({ entry, controls }: Props) {
  const { Root, Child } = resolveModule(entry);
  if (!Root) return <div className="empty">Component not found.</div>;

  const axis = findPrimaryVariantAxis(entry.spec);
  const variantValues = axis?.values ?? [null];

  return (
    <div className="matrix-grid" style={{ gridTemplateColumns: `max-content repeat(${COLOR_THEMES.length}, 1fr)` }}>
      <div className="matrix-corner" />
      {COLOR_THEMES.map((t) => (
        <div className="matrix-col-head" key={`col-${t}`}>{t}</div>
      ))}

      {variantValues.map((v) => (
        <Row
          key={String(v)}
          axisName={axis?.name}
          variantValue={v}
          entry={entry}
          controls={controls}
          Root={Root}
          Child={Child}
        />
      ))}
    </div>
  );
}

function Row({
  axisName,
  variantValue,
  entry,
  controls,
  Root,
  Child,
}: {
  axisName: string | undefined;
  variantValue: string | null;
  entry: Entry;
  controls: Record<string, unknown>;
  Root: React.ComponentType<Record<string, unknown>>;
  Child: React.ComponentType<Record<string, unknown>> | undefined;
}) {
  const rowProps = variantValue ? { ...controls, [axisName!]: variantValue } : controls;
  return (
    <>
      <div className="matrix-row-head">
        {variantValue ? (
          <><code>{axisName}</code><strong>{variantValue}</strong></>
        ) : (
          entry.spec.component
        )}
      </div>
      {COLOR_THEMES.map((t) => (
        <div
          className={`matrix-cell theme-${t}`}
          key={`${variantValue}-${t}`}
        >
          {createElement(
            Root,
            baseProps(entry.spec, rowProps),
            defaultChildrenFor(entry.spec.component, Child),
          )}
        </div>
      ))}
    </>
  );
}
