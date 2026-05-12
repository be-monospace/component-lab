import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders title + body with default status (neutral, polite live region)', () => {
    render(<Alert title="A side note">Server connection interrupted.</Alert>);
    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('A side note');
    expect(region).toHaveTextContent('Server connection interrupted.');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('uses role="alert" with assertive live region for status=danger', () => {
    render(<Alert status="danger" title="Failed">Bad request.</Alert>);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders a dismiss button when onDismiss is provided', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <Alert title="A side note" onDismiss={onDismiss}>
        Body.
      </Alert>,
    );
    const button = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('does not render a dismiss button when onDismiss is omitted', () => {
    render(<Alert title="A side note">Body.</Alert>);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('hides the auto-picked icon when icon={null}', () => {
    const { container } = render(
      <Alert title="No icon" icon={null}>
        Body.
      </Alert>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });

  it('renders actions slot when provided', () => {
    render(
      <Alert title="With actions" actions={<button>Retry</button>}>
        Body.
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
