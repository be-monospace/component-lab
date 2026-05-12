import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import styles from './Tabs.module.css';

type TabsVariant = 'minimal' | 'solid';

type TabsContextValue = {
  variant: TabsVariant;
  value: string | undefined;
  setValue: (value: string) => void;
  register: (value: string) => void;
  unregister: (value: string) => void;
  ordered: () => string[];
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Tabs>.`);
  }
  return ctx;
}

type TabsOwnProps = {
  variant?: TabsVariant;
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible label for the tablist, required when no visible heading is associated. */
  'aria-label'?: string;
  children: ReactNode;
};

export type TabsProps = TabsOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof TabsOwnProps | 'role'>;

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    variant = 'minimal',
    value: controlledValue,
    defaultValue,
    onValueChange,
    className,
    children,
    ...rest
  },
  ref,
) {
  const baseId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  // Registry of tab values in DOM order, so arrow keys can walk neighbours.
  const valuesRef = useRef<string[]>([]);
  const register = useCallback((v: string) => {
    if (!valuesRef.current.includes(v)) valuesRef.current.push(v);
  }, []);
  const unregister = useCallback((v: string) => {
    valuesRef.current = valuesRef.current.filter((x) => x !== v);
  }, []);
  const ordered = useCallback(() => valuesRef.current.slice(), []);

  const ctx = useMemo<TabsContextValue>(
    () => ({ variant, value, setValue, register, unregister, ordered, baseId }),
    [variant, value, setValue, register, unregister, ordered, baseId],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        className={cn(styles.tablist, styles[`variant-${variant}`], className)}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

type TabOwnProps = {
  value: string;
  disabled?: boolean;
  children: ReactNode;
};

export type TabProps = TabOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof TabOwnProps | 'role' | 'type'>;

export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, disabled = false, className, children, onKeyDown, onClick, ...rest },
  ref,
) {
  const { value: selected, setValue, register, unregister, ordered, baseId } =
    useTabsContext('Tab');

  useEffect(() => {
    register(value);
    return () => unregister(value);
  }, [value, register, unregister]);

  const isSelected = selected === value;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && !disabled) setValue(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled) return;

    const list = ordered();
    const currentIndex = list.indexOf(value);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % list.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + list.length) % list.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = list.length - 1;
        break;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextValue = list[nextIndex]!;
      setValue(nextValue);
      // Move focus to the newly selected tab.
      const root = (event.currentTarget.closest('[role="tablist"]') ?? document) as ParentNode;
      const nextEl = root.querySelector<HTMLButtonElement>(
        `[data-tab-value="${CSS.escape(nextValue)}"]`,
      );
      nextEl?.focus();
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isSelected}
      aria-controls={`${baseId}-panel-${value}`}
      aria-disabled={disabled || undefined}
      tabIndex={isSelected ? 0 : -1}
      data-tab-value={value}
      disabled={disabled}
      className={cn(styles.tab, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
});
