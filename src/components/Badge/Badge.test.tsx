import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, type BadgeStatus, type BadgeSize } from './Badge';

describe('Badge', () => {
  it('renders the label as a status region', () => {
    render(<Badge label="In stock" />);
    expect(screen.getByRole('status')).toHaveTextContent('In stock');
  });

  it('emits aria-label prefixed with the status word for screen readers', () => {
    render(<Badge status="warning" label="Low stock" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Warning: Low stock');
  });

  it('shows the status-matched icon by default', () => {
    const { container } = render(<Badge status="success" label="In stock" />);
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('hides the icon when showIcon is false', () => {
    const { container } = render(<Badge label="Tag" showIcon={false} />);
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('uses md size and neutral status by default', () => {
    const { container } = render(<Badge label="Default" />);
    const root = container.firstElementChild!;
    expect(root.className).toMatch(/size-md/);
    expect(root.className).toMatch(/status-neutral/);
  });

  it('renders all five statuses without crashing', () => {
    const statuses: BadgeStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];
    statuses.forEach((s) => {
      const { container } = render(<Badge status={s} label={s} />);
      expect(container.firstElementChild?.className).toMatch(new RegExp(`status-${s}`));
    });
  });

  it('renders all five sizes without crashing', () => {
    const sizes: BadgeSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    sizes.forEach((s) => {
      const { container } = render(<Badge size={s} label={s} />);
      expect(container.firstElementChild?.className).toMatch(new RegExp(`size-${s}`));
    });
  });
});
