import { useEffect, useMemo, useState } from 'react';
import { registry, findById } from './lib/registry';
import { useHashRoute } from './lib/hashRoute';
import { Sidebar } from './components/Sidebar';
import { type ThemeState, applyTheme } from './components/ThemeSwitcher';
import { Studio, type ViewMode } from './components/Studio';
import { Controls, type ControlValues } from './components/Controls';
import { SpecPanel } from './components/SpecPanel';
import { TokenTrace } from './components/TokenTrace';
import { JsonTab } from './components/JsonTab';
import { Playground } from './Playground';

const DEFAULT_THEME: ThemeState = {
  color: 'light',
};

type DetailTab = 'controls' | 'spec' | 'tokens' | 'json';

export function App() {
  const [routeId, navigate] = useHashRoute();
  const isPlayground = routeId === 'play';
  const entry = useMemo(
    () => (isPlayground ? undefined : findById(routeId) ?? registry[0]),
    [routeId, isPlayground],
  );

  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);
  const [view, setView] = useState<ViewMode>('variants');
  const [tab, setTab] = useState<DetailTab>('controls');
  const [controls, setControls] = useState<ControlValues>({});

  useEffect(() => {
    if (!entry) return;
    const initial: ControlValues = {};
    for (const [name, p] of Object.entries(entry.spec.props)) {
      if (p.default !== undefined) initial[name] = p.default as string | boolean;
    }
    setControls(initial);
  }, [entry]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (isPlayground) {
    return (
      <div className="workbench-app">
        <div className="app">
          <Sidebar entries={registry} activeId="play" onSelect={(id) => navigate(id)} />
          <main className="main">
            <Playground />
          </main>
        </div>
      </div>
    );
  }

  if (!entry) {
    return <div className="empty">No components yet. Add one under src/components.</div>;
  }

  return (
    <div className="workbench-app">
      <div className="app">
        <Sidebar
          entries={registry}
          activeId={entry.id}
          onSelect={(id) => navigate(id)}
        />

        <main className="main">
          <header className="header">
            <div className="header-meta">
              <span className="mcp-indicator" title="Spec is live; an MCP server would return it as JSON.">
                <span className="mcp-dot" />
                mcp · live
              </span>
            </div>
            <h1>{entry.spec.component}</h1>
            <p className="desc">{entry.spec.description}</p>
          </header>

          <Studio
            entry={entry}
            controls={controls}
            theme={theme}
            onThemeChange={setTheme}
            view={view}
            onViewChange={setView}
          />

          <section className="details">
            <div className="tabs" role="tablist" aria-label="component details">
              {(['controls', 'spec', 'tokens', 'json'] as const).map((id) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  className={`tab${tab === id ? ' is-active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="tab-panel">
              {tab === 'controls' && (
                <Controls spec={entry.spec} values={controls} onChange={setControls} />
              )}
              {tab === 'spec' && <SpecPanel spec={entry.spec} />}
              {tab === 'tokens' && <TokenTrace spec={entry.spec} />}
              {tab === 'json' && <JsonTab spec={entry.spec} />}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
