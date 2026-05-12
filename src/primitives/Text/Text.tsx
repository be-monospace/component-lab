import {
  forwardRef,
  type ElementType,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from 'react';
import { cn } from '../../lib/cn';
import styles from './Text.module.css';

export type TextVariant =
  | 'body-sm' | 'body-md' | 'body-lg'
  | 'heading-sm' | 'heading-md' | 'heading-lg'
  | 'label' | 'caption';

export type TextTone =
  | 'default' | 'muted' | 'subtle' | 'inverse'
  | 'accent' | 'success' | 'warning' | 'danger';

const TONE: Record<TextTone, string> = {
  default: 'var(--color-text-default)',
  muted: 'var(--color-text-muted)',
  subtle: 'var(--color-text-subtle)',
  inverse: 'var(--color-text-inverse)',
  accent: 'var(--color-text-accent)',
  success: 'var(--color-text-success)',
  warning: 'var(--color-text-warning)',
  danger: 'var(--color-text-danger)',
};

type Own = {
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  align?: 'start' | 'center' | 'end';
  truncate?: boolean;
};

export type TextProps = Own & Omit<ComponentPropsWithoutRef<'span'>, keyof Own>;

export const Text = forwardRef<HTMLSpanElement, TextProps>(function Text(
  { as: Tag = 'span', variant = 'body-md', tone = 'default',
    align, truncate, className, style, ...rest },
  ref,
) {
  const s: CSSProperties = {
    font: `var(--typography-${variant})`,
    color: TONE[tone],
    ...style,
  };
  return (
    <Tag
      ref={ref}
      className={cn(
        styles.text,
        align && styles[`align-${align}`],
        truncate && styles.truncate,
        className,
      )}
      style={s}
      {...rest}
    />
  );
});
