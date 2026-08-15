import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Rendered instead of the children when a descendant throws during render. */
  fallback: ReactNode;
  children: ReactNode;
  /** Optional label used to identify the boundary in console output. */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Catches render-phase errors from a subtree and renders a fallback instead.
 *
 * This exists primarily to contain the third-party 3D scene in the homepage hero.
 * `@splinetool/react-spline` re-throws its load failures *during render*, and a
 * `<Suspense>` boundary only catches thrown promises — not thrown errors. Without a
 * boundary, a WebGL-unavailable device or a failed scene/CDN request unmounts the
 * entire React root, so a fully painted page turns blank a moment after load.
 *
 * Keep the fallback cheap and static: it must never depend on the thing that failed.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Surface it for debugging without escalating: the page stays usable either way.
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
