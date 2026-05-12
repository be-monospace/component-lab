import { ThemeSwitcher, type ThemeState } from './ThemeSwitcher';
import { SingleView } from '../views/SingleView';
import { VariantsView } from '../views/VariantsView';
import { StatesView } from '../views/StatesView';
import { MatrixView } from '../views/MatrixView';
import type { Entry } from '../lib/render';

export type ViewMode = 'variants' | 'states' | 'matrix' | 'single';

type Props = {
  entry: Entry;
  controls: Record<string, unknown>;
  theme: ThemeState;
  onThemeChange: (next: ThemeState) => void;
  view: ViewMode;
  onViewChange: (next: ViewMode) => void;
};

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'variants', label: 'variants' },
  { id: 'states', label: 'states' },
  { id: 'matrix', label: 'matrix' },
  { id: 'single', label: 'single' },
];

export function Studio({ entry, controls, theme, onThemeChange, view, onViewChange }: Props) {
  return (
    <section className="studio">
      <div className="studio-bar">
        <div className="seg" role="tablist" aria-label="view mode">
          {VIEWS.map((v) => (
            <button
              type="button"
              role="tab"
              aria-selected={view === v.id}
              key={v.id}
              className={`seg-btn${view === v.id ? ' is-active' : ''}`}
              onClick={() => onViewChange(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="studio-divider" />
        <ThemeSwitcher value={theme} onChange={onThemeChange} />
      </div>

      <div className="stage">
        {view === 'single' && <SingleView entry={entry} controls={controls} />}
        {view === 'variants' && <VariantsView entry={entry} controls={controls} />}
        {view === 'states' && <StatesView entry={entry} controls={controls} />}
        {view === 'matrix' && <MatrixView entry={entry} controls={controls} />}
      </div>
    </section>
  );
}
