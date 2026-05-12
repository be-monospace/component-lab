import { useEffect, useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { evalPlayground, preloadBabel, type EvalResult } from './lib/playground-eval';
import { ErrorBoundary } from './components/ErrorBoundary';

const STORAGE_KEY = 'wb:playground:code';

const STARTER = `<Alert variant="box" status="informational" title="Heads up" onDismiss={() => {}}>
  This is a sandbox — edit the code on the left, see the result on the right.
  Anything you export from the library is in scope (Alert, Tabs, Tab, Stack,
  Text, Icon), plus React hooks.
</Alert>`;

const SNIPPETS: { label: string; code: string }[] = [
  {
    label: 'alert · all statuses',
    code: `<Stack gap="md">
  {['informational', 'success', 'warning', 'error', 'important', 'neutral'].map((status) => (
    <Alert key={status} status={status} title={status}>
      Body for the {status} variant.
    </Alert>
  ))}
</Stack>`,
  },
  {
    label: 'tabs · minimal vs solid',
    code: `<Stack gap="xl">
  <Tabs variant="minimal" defaultValue="a" aria-label="minimal">
    <Tab value="a">Alpha</Tab>
    <Tab value="b">Beta</Tab>
    <Tab value="c">Gamma</Tab>
  </Tabs>
  <Tabs variant="solid" defaultValue="a" aria-label="solid">
    <Tab value="a">Alpha</Tab>
    <Tab value="b">Beta</Tab>
    <Tab value="c">Gamma</Tab>
  </Tabs>
</Stack>`,
  },
  {
    label: 'stack · text · icon',
    code: `<Stack gap="sm" align="center" direction="row">
  <Icon name="info" tone="information" size="lg" />
  <Text variant="heading-title">Composed from primitives</Text>
</Stack>`,
  },
];

export function Playground() {
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? STARTER;
  });
  const [result, setResult] = useState<EvalResult | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const debounceRef = useRef<number | null>(null);

  // Preload Babel on mount so the first transform is snappy.
  useEffect(() => {
    preloadBabel();
  }, []);

  // Debounced live transform.
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      localStorage.setItem(STORAGE_KEY, code);
      const r = await evalPlayground(code);
      setResult(r);
      setRenderKey((k) => k + 1);
    }, 220);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [code]);

  const extensions = useMemo(() => [javascript({ jsx: true, typescript: false })], []);

  return (
    <div className="playground">
      <header className="header">
        <h1>playground</h1>
        <p className="desc">
          Sketch a component with any props. No spec, no test, no commit — just JSX and a live preview.
          What you write is saved to <code>localStorage</code>.
        </p>
      </header>

      <div className="play-toolbar">
        <div className="play-snippets">
          <span className="play-snippets-label">starters</span>
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="play-snippet-btn"
              onClick={() => setCode(s.code)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="play-reset-btn"
          onClick={() => setCode(STARTER)}
        >
          reset
        </button>
      </div>

      <div className="play-grid">
        <div className="play-editor">
          <CodeMirror
            value={code}
            height="100%"
            extensions={extensions}
            onChange={(v: string) => setCode(v)}
            theme="light"
            basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          />
        </div>

        <div className="play-preview-wrap">
          <div className="play-preview">
            {result?.ok && (
              <ErrorBoundary
                resetKey={renderKey}
                fallback={(error) => (
                  <div className="play-error">
                    <strong>Render error.</strong> {error.message}
                  </div>
                )}
              >
                {result.element}
              </ErrorBoundary>
            )}
          </div>
          {result && !result.ok && (
            <div className="play-error">
              <strong>—</strong> {result.error}
            </div>
          )}
        </div>
      </div>

      <div className="play-scope">
        <span className="play-scope-label">in scope:</span>
        <code>React</code>
        <code>useState</code>
        <code>useEffect</code>
        <code>useMemo</code>
        <code>Alert</code>
        <code>Tabs</code>
        <code>Tab</code>
        <code>Stack</code>
        <code>Text</code>
        <code>Icon</code>
        <code>cn</code>
      </div>
    </div>
  );
}
