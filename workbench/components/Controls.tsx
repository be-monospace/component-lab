import type { AnySpec, PropSpec } from '../../src/lib/spec';

export type ControlValues = Record<string, string | boolean | number | undefined>;

type Props = {
  spec: AnySpec;
  values: ControlValues;
  onChange: (next: ControlValues) => void;
};

export function Controls({ spec, values, onChange }: Props) {
  const entries = Object.entries(spec.props);
  if (entries.length === 0) return <p className="muted">No props.</p>;

  const set = (name: string, value: string | boolean | undefined) =>
    onChange({ ...values, [name]: value });

  return (
    <div className="controls">
      {entries.map(([name, prop]) => (
        <div className="control-row" key={name}>
          <div className="control-label">
            <code>{name}</code>
            {prop.description && <span className="control-desc">{prop.description}</span>}
          </div>
          <div className="control-input">{renderInput(name, prop, values[name], set)}</div>
        </div>
      ))}
    </div>
  );
}

function renderInput(
  name: string,
  prop: PropSpec<unknown>,
  current: string | boolean | number | undefined,
  set: (n: string, v: string | boolean | undefined) => void,
) {
  if (prop.type === 'enum' && prop.values) {
    return (
      <div className="seg">
        {prop.values.map((v) => (
          <button
            key={v}
            type="button"
            className={`seg-btn${current === v ? ' is-active' : ''}`}
            onClick={() => set(name, v)}
          >
            {v}
          </button>
        ))}
      </div>
    );
  }
  if (prop.type === 'boolean') {
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={Boolean(current)}
          onChange={(e) => set(name, e.target.checked)}
        />
        {String(Boolean(current))}
      </label>
    );
  }
  if (prop.type === 'callback') {
    return <span className="muted">(callback)</span>;
  }
  return (
    <input
      type="text"
      value={current == null ? '' : String(current)}
      placeholder={prop.default != null ? String(prop.default) : ''}
      onChange={(e) => set(name, e.target.value || undefined)}
    />
  );
}
