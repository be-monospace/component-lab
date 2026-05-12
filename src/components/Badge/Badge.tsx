import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../../primitives/Icon';
import styles from './Badge.module.css';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BadgeStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Own = {
  size?: BadgeSize;
  status?: BadgeStatus;
  /** Text shown inside the badge. Required — a badge without a label is a status dot. */
  label: string;
  /** Show the status-matched icon to the left of the label. */
  showIcon?: boolean;
};

export type BadgeProps = Own &
  Omit<ComponentPropsWithoutRef<'span'>, keyof Own | 'role' | 'aria-label'>;

const STATUS_ICON: Record<BadgeStatus, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'error',
};

const STATUS_LABEL: Record<BadgeStatus, string> = {
  neutral: 'Note',
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

const ICON_SIZE: Record<BadgeSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { size = 'md', status = 'neutral', label, showIcon = true, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={`${STATUS_LABEL[status]}: ${label}`}
      className={cn(styles.root, styles[`size-${size}`], styles[`status-${status}`], className)}
      {...rest}
    >
      {showIcon && (
        <span className={styles.icon}>
          <Icon name={STATUS_ICON[status]} size={ICON_SIZE[size]} tone="inherit" />
        </span>
      )}
      <span className={styles.label}>{label}</span>
    </span>
  );
});
