'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; receives the reset callback. */
  fallback?: (reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Page-level error boundary matching the dark design system. Contains render
 * errors to the wrapped subtree and offers a "Try again" reset.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, info.componentStack);
    } else {
      // Structured shape, ready for a future Sentry integration.
      const payload = {
        level: 'error',
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        time: new Date().toISOString(),
      };
      console.error(JSON.stringify(payload));
    }
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback(this.reset);
    }

    return (
      <div
        role="alert"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <FiAlertTriangle className="h-12 w-12 text-white/40" aria-hidden="true" />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-white/80">Something went wrong</h2>
          <p className="text-sm text-white/60">
            An unexpected error occurred while rendering this page.
          </p>
        </div>
        <button
          type="button"
          onClick={this.reset}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
