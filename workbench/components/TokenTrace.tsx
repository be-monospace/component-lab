import { useEffect, useMemo, useState } from 'react';
import type { AnySpec } from '../../src/lib/spec';
import { traceToken, getResolvedValue, type TraceStep } from '../lib/tokenTrace';
import { Copyable } from './Copyable';

type Props = { spec: AnySpec };

export function TokenTrace({ spec }: Props) {
  if (!spec.tokens) return <p className="muted">No tokens declared.</p>;
  return (
    <div className="token-trace">
      {Object.entries(spec.tokens).map(([category, names]) => (
        <details key={category} open>
          <summary>
            <span className="trace-category">{category}</span>
            <span className="trace-count">{names.length}</span>
          </summary>
          <div className="trace-list">
            {names.map((n) => (
              <TraceRow key={n} tokenName={n as string} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function TraceRow({ tokenName }: { tokenName: string }) {
  const steps = useMemo<TraceStep[]>(() => traceToken(tokenName), [tokenName]);
  const [resolved, setResolved] = useState<string>('');
  useEffect(() => {
    const update = () => setResolved(getResolvedValue(tokenName));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [tokenName]);

  return (
    <div className="trace-row">
      <div className="trace-head">
        <Copyable value={`--${tokenName}`}>
          <code className="token-name">--{tokenName}</code>
        </Copyable>
        <Swatch value={resolved} />
        <code className="resolved-leaf">{resolved || '(unresolved)'}</code>
      </div>
      <ol className="trace-chain">
        {steps.slice(1).map((step) => (
          <li key={step.name} className={step.isLiteral ? 'is-literal' : ''}>
            <code>--{step.name}</code>
            <span className="trace-arrow">→</span>
            <span className="raw">{step.rawValue}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Swatch({ value }: { value: string }) {
  const isColor = /^#[0-9a-f]{3,8}$/i.test(value) || /^(rgb|hsl|oklch)/i.test(value);
  if (!isColor) return null;
  return <span className="swatch swatch-lg" style={{ background: value }} />;
}
