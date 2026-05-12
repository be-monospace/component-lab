import type { AnySpec } from '../../src/lib/spec';

type Entry = { id: string; spec: AnySpec };

type Props = {
  entries: Entry[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function Sidebar({ entries, activeId, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">component · lab</div>
      <p className="sidebar-tagline">A spec-driven workbench for design system components.</p>
      <nav>
        <div className="sidebar-section">sketch</div>
        <button
          className={`sidebar-item${activeId === 'play' ? ' is-active' : ''}`}
          onClick={() => onSelect('play')}
        >
          playground
        </button>
        <div className="sidebar-section">components</div>
        {entries.map((e) => (
          <button
            key={e.id}
            className={`sidebar-item${e.id === activeId ? ' is-active' : ''}`}
            onClick={() => onSelect(e.id)}
          >
            {e.spec.component}
          </button>
        ))}
      </nav>
    </aside>
  );
}
