import { useState, type ReactNode } from 'react';

type Props = {
  value: string;
  children: ReactNode;
  className?: string;
};

/** Inline wrapper that reveals a copy button on hover. Click copies `value`
 *  to clipboard with a 1.2s "copied" confirmation. */
export function Copyable({ value, children, className }: Props) {
  const [state, setState] = useState<'idle' | 'copied'>('idle');

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
      window.setTimeout(() => setState('idle'), 1200);
    } catch {
      /* clipboard blocked; ignore */
    }
  };

  return (
    <span className={`copyable${className ? ' ' + className : ''}`}>
      {children}
      <button
        type="button"
        className="copy-btn"
        onClick={copy}
        title={`copy ${value}`}
        aria-label={`copy ${value}`}
      >
        {state === 'copied' ? '✓' : '⧉'}
      </button>
    </span>
  );
}
