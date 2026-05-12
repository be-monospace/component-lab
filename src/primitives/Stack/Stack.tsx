import { forwardRef, type ElementType, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import styles from './Stack.module.css';

export type Spacing =
  | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const GAP: Record<Spacing, string> = {
  none: 'var(--space-0)',
  xs: 'var(--space-2)',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-7)',
  xl: 'var(--space-9)',
  '2xl': 'var(--space-10)',
  '3xl': 'var(--space-11)',
};

const PAD: Record<Spacing, string> = {
  none: 'var(--space-0)',
  xs: 'var(--space-2)',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-7)',
  xl: 'var(--space-9)',
  '2xl': 'var(--space-10)',
  '3xl': 'var(--space-11)',
};

type Own = {
  as?: ElementType;
  direction?: 'row' | 'column';
  gap?: Spacing;
  padding?: Spacing;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  inline?: boolean;
};

export type StackProps = Own & Omit<ComponentPropsWithoutRef<'div'>, keyof Own>;

export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { as: Tag = 'div', direction = 'column', gap, padding, align, justify, wrap, inline,
    className, style, ...rest },
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cn(
        styles.stack,
        styles[`direction-${direction}`],
        align && styles[`align-${align}`],
        justify && styles[`justify-${justify}`],
        wrap && styles.wrap,
        inline && styles.inline,
        className,
      )}
      style={{
        ...(gap !== undefined ? { gap: GAP[gap] } : null),
        ...(padding !== undefined ? { padding: PAD[padding] } : null),
        ...style,
      }}
      {...rest}
    />
  );
});
