import { Component, type ReactNode } from 'react';

type Props = {
  /** Keyed re-render — when this changes, reset the boundary. */
  resetKey?: string | number;
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
};

type State = { error: Error | null };

/** Tiny error boundary for the playground preview. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  override render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}
