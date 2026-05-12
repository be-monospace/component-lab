import { forwardRef, type SVGProps } from 'react';
import { cn } from '../../lib/cn';
import styles from './Icon.module.css';

const PATHS: Record<string, string> = {
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 6Zm1 12h-2v-7h2v7Z',
  close: 'M18.3 5.71 12 12.01l-6.3-6.3-1.4 1.41L10.59 13.4l-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3-1.41-1.4Z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z',
  warning: 'M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z',
  error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2Z',
};

export type IconName = keyof typeof PATHS;

export type IconTone =
  | 'inherit' | 'default' | 'muted' | 'inverse'
  | 'accent' | 'info' | 'success' | 'warning' | 'danger';

type Own = {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | number;
  tone?: IconTone;
  label?: string;
};

export type IconProps = Own & Omit<SVGProps<SVGSVGElement>, keyof Own>;

const SIZE: Record<'sm' | 'md' | 'lg', number> = { sm: 14, md: 16, lg: 20 };

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, size = 'md', tone = 'inherit', label, className, ...rest },
  ref,
) {
  const px = typeof size === 'number' ? size : SIZE[size];
  const decorative = !label;
  return (
    <svg
      ref={ref}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      className={cn(styles.icon, styles[`tone-${tone}`], className)}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
});
