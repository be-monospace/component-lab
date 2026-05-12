export const COLOR_THEMES = ['light', 'dark'] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export type ThemeState = {
  color: ColorTheme;
};

export function applyTheme(t: ThemeState, el: HTMLElement = document.body) {
  el.className = el.className
    .split(/\s+/)
    .filter((c) => !c.startsWith('theme-'))
    .concat([`theme-${t.color}`])
    .join(' ');
}

type Props = { value: ThemeState; onChange: (next: ThemeState) => void };

export function ThemeSwitcher({ value, onChange }: Props) {
  return (
    <div className="theme-switcher">
      <label>
        <span>theme</span>
        <select
          value={value.color}
          onChange={(e) => onChange({ ...value, color: e.target.value as ColorTheme })}
        >
          {COLOR_THEMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
