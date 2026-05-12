import { useState } from 'react';
import type { AnySpec } from '../../src/lib/spec';

type Props = { spec: AnySpec };

/** Shows the spec as the structured payload an MCP query would return.
 *  Helps make the agent surface tangible. Copy-to-clipboard included. */
export function JsonTab({ spec }: Props) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(spec, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="json-tab">
      <div className="json-tab-head">
        <span className="muted">payload returned by <code>get_component_spec</code></span>
        <button type="button" className="json-copy-btn" onClick={copy}>
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="json-block"><code>{json}</code></pre>
    </div>
  );
}
