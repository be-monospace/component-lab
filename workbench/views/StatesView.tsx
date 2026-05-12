import { createElement, useEffect, useRef } from 'react';
import type { Entry } from '../lib/render';
import { resolveModule, baseProps, defaultChildrenFor } from '../lib/render';

type Props = { entry: Entry; controls: Record<string, unknown> };

const STATES = ['default', 'hover', 'focus', 'active', 'disabled'] as const;
type State = (typeof STATES)[number];

/**
 * Renders the component once per interaction state. For non-default states,
 * we post-mount apply `data-force-state="<state>"` to the first matching
 * interactive descendant. Components must support the contract in CSS:
 *
 *   .button:hover, .button[data-force-state='hover'] { … }
 *
 * Selectors are tried in order; the first match wins.
 */
const INTERACTIVE_SELECTOR =
  '[role="tab"]:not([aria-selected="true"]), [role="tab"], button, a, input, [tabindex]:not([tabindex="-1"])';

export function StatesView({ entry, controls }: Props) {
  const { Root, Child } = resolveModule(entry);
  if (!Root) return <div className="empty">Component not found.</div>;

  return (
    <div className="cells states-cells">
      {STATES.map((state) => (
        <StateCell key={state} state={state}>
          {createElement(
            Root,
            baseProps(entry.spec, controls),
            defaultChildrenFor(entry.spec.component, Child),
          )}
        </StateCell>
      ))}
    </div>
  );
}

function StateCell({ state, children }: { state: State; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const target = ref.current.querySelector<HTMLElement>(INTERACTIVE_SELECTOR);
    if (!target) return;

    if (state === 'default') {
      delete target.dataset.forceState;
    } else {
      target.dataset.forceState = state;
    }
    return () => {
      delete target.dataset.forceState;
    };
  }, [state]);

  return (
    <div className="cell" ref={ref}>
      <div className="cell-label">
        <code>state</code> = <strong>{state}</strong>
      </div>
      <div className="cell-render">{children}</div>
    </div>
  );
}
