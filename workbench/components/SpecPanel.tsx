import type { AnySpec } from '../../src/lib/spec';
import { Copyable } from './Copyable';

type Props = { spec: AnySpec };

export function SpecPanel({ spec }: Props) {
  return (
    <div className="spec-panel">
      <div className="spec-row">
        <span className="spec-key">react</span>
        <Copyable value={spec.reactName}><code>{spec.reactName}</code></Copyable>
      </div>
      <div className="spec-row">
        <span className="spec-key">import</span>
        <Copyable value={`import { ${spec.reactName} } from '${spec.import}';`}>
          <code>{spec.import}</code>
        </Copyable>
      </div>
      {spec.figmaNodeId && (
        <div className="spec-row">
          <span className="spec-key">figma node</span>
          <span className="spec-cell">
            <Copyable value={spec.figmaNodeId}>
              <code>{spec.figmaNodeId}</code>
            </Copyable>
            {spec.figmaUrl && (
              <a href={spec.figmaUrl} target="_blank" rel="noreferrer" className="ext-link">
                open ↗
              </a>
            )}
          </span>
        </div>
      )}
      {spec.docsUrl && (
        <div className="spec-row">
          <span className="spec-key">docs</span>
          <a href={spec.docsUrl} target="_blank" rel="noreferrer" className="ext-link">
            supernova ↗
          </a>
        </div>
      )}

      {spec.figmaInternalAxes && spec.figmaInternalAxes.length > 0 && (
        <div className="spec-row">
          <span className="spec-key">figma-only axes</span>
          <span>
            {spec.figmaInternalAxes.map((a) => <code key={a} className="chip">{a}</code>)}
          </span>
        </div>
      )}

      {spec.composition?.children && (
        <div className="spec-row">
          <span className="spec-key">children</span>
          <span>
            {spec.composition.children.map((c) => (
              <code key={c.component} className="chip">
                {c.component}{c.role ? ` · ${c.role}` : ''}
              </code>
            ))}
          </span>
        </div>
      )}

      {spec.accessibility && (
        <details className="spec-acc" open>
          <summary>accessibility · {spec.accessibility.pattern?.toLowerCase()}</summary>
          {spec.accessibility.roleRoot && (
            <div className="spec-row">
              <span className="spec-key">root role</span>
              <Copyable value={spec.accessibility.roleRoot}>
                <code>{spec.accessibility.roleRoot}</code>
              </Copyable>
            </div>
          )}
          {spec.accessibility.keyboard && (
            <div className="kbd-list">
              {Object.entries(spec.accessibility.keyboard).map(([k, v]) => (
                <div className="kbd-row" key={k}>
                  <kbd>{k}</kbd>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          )}
          {spec.accessibility.requiredAttrs && (
            <div className="spec-row" style={{ marginTop: 12 }}>
              <span className="spec-key">required attrs</span>
              <span>{spec.accessibility.requiredAttrs.map((a) => <code key={a} className="chip">{a}</code>)}</span>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
