import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  private handleReload = () => {
    window.location.assign('/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-[100dvh] bg-bg flex items-center justify-center p-6">
        <div className="max-w-[440px] w-full bg-surface border border-line rounded-[14px] p-8 text-center">
          <div className="w-14 h-14 rounded-[14px] bg-danger-dim flex items-center justify-center mx-auto mb-[18px]">
            <AlertTriangle size={26} className="text-danger" />
          </div>
          <h1 className="text-xl font-bold text-fg mb-2">
            Something went wrong
          </h1>
          <p className="text-[13px] text-[#a1a1aa] leading-[1.6] mb-6">
            The application ran into an unexpected error. Reload to try again — if it keeps happening, contact support.
          </p>
          {import.meta.env.DEV && this.state.error.message && (
            <pre className="text-[11px] text-danger bg-danger/[0.06] border border-danger/20 rounded-lg p-2.5 mb-5 text-left overflow-auto max-h-[120px] whitespace-pre-wrap break-words">{this.state.error.message}</pre>
          )}
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white border-none rounded-lg text-sm font-semibold cursor-pointer"
          >
            <RefreshCw size={15} />
            Reload App
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
