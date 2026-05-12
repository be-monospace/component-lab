import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, Tab } from './Tabs';

function setup(props?: Partial<React.ComponentProps<typeof Tabs>>) {
  return render(
    <Tabs defaultValue="a" aria-label="Demo" {...props}>
      <Tab value="a">A</Tab>
      <Tab value="b">B</Tab>
      <Tab value="c" disabled>
        C
      </Tab>
      <Tab value="d">D</Tab>
    </Tabs>,
  );
}

describe('Tabs', () => {
  it('renders a tablist with the correct accessible name', () => {
    setup();
    expect(screen.getByRole('tablist', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('marks the default value as selected', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'false');
  });

  it('selects on click and fires onValueChange', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    setup({ onValueChange });

    await user.click(screen.getByRole('tab', { name: 'B' }));

    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
  });

  it('moves with arrow keys (with wrap)', async () => {
    const user = userEvent.setup();
    setup();
    const a = screen.getByRole('tab', { name: 'A' });
    const b = screen.getByRole('tab', { name: 'B' });
    const d = screen.getByRole('tab', { name: 'D' });

    a.focus();
    await user.keyboard('{ArrowRight}');
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowLeft}');
    expect(a).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(d).toHaveFocus(); // wrapped to end
  });

  it('jumps to first/last with Home/End', async () => {
    const user = userEvent.setup();
    setup({ defaultValue: 'b' });
    const a = screen.getByRole('tab', { name: 'A' });
    const d = screen.getByRole('tab', { name: 'D' });

    screen.getByRole('tab', { name: 'B' }).focus();

    await user.keyboard('{End}');
    expect(d).toHaveFocus();

    await user.keyboard('{Home}');
    expect(a).toHaveFocus();
  });

  it('skips selection for disabled tabs on click', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    setup({ onValueChange });

    await user.click(screen.getByRole('tab', { name: 'C' }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'false');
  });

  it('manages roving tabindex (only selected tab is in tab order)', () => {
    setup();
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('tabindex', '-1');
  });
});
