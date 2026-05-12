import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { Icon, type IconName } from '../../primitives/Icon';
import styles from './Alert.module.css';

export type AlertVariant = 'box' | 'header';
export type AlertStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Own = {
  variant?: AlertVariant;
  status?: AlertStatus;
  /** Headline shown next to the icon. Optional. */
  title?: string;
  /** Override the auto-picked icon for the status. Pass `null` to hide. */
  icon?: ReactNode;
  /** Slot for action buttons below the body. */
  actions?: ReactNode;
  /** Called when the dismiss button is clicked. Presence = dismissible. */
  onDismiss?: () => void;
  children?: ReactNode;
};

export type AlertProps = Own &
  Omit<ComponentPropsWithoutRef<'div'>, keyof Own | 'role'>;

/** Default icon per status. Designers can override via the `icon` prop. */
const STATUS_ICON: Record<AlertStatus, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'check',
  warning: 'warning',
  danger: 'error',
};

/** Errors are assertive; everything else is polite. */
function roleFor(status: AlertStatus): { role: 'status' | 'alert'; live: 'polite' | 'assertive' } {
  return status === 'danger'
    ? { role: 'alert', live: 'assertive' }
    : { role: 'status', live: 'polite' };
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    variant = 'box',
    status = 'neutral',
    title,
    icon,
    actions,
    onDismiss,
    children,
    className,
    ...rest
  },
  ref,
) {
  const { role, live } = roleFor(status);
  const resolvedIcon =
    icon === null ? null : icon ?? <Icon name={STATUS_ICON[status]} size="lg" />;

  return (
    <div
      ref={ref}
      role={role}
      aria-live={live}
      className={cn(styles.root, styles[`variant-${variant}`], styles[`status-${status}`], className)}
      {...rest}
    >
      <div className={styles.header}>
        {resolvedIcon && <span className={styles.icon}>{resolvedIcon}</span>}
        {title && <p className={styles.headline}>{title}</p>}
        {onDismiss && (
          <button
            type="button"
            className={styles.dismiss}
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <Icon name="close" size="md" />
          </button>
        )}
      </div>

      {children && (
        <div className={styles.body}>
          <p className={styles.copy}>{children}</p>
        </div>
      )}

      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
});
