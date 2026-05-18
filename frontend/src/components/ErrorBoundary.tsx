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
      <div style={{
        minHeight: '100dvh',
        background: '#0a0a0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          maxWidth: 440,
          width: '100%',
          background: '#111113',
          border: '1px solid #27272a',
          borderRadius: 14,
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(248,113,113,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <AlertTriangle size={26} color="#f87171" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f4f4f5', marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
            The application ran into an unexpected error. Reload to try again — if it keeps happening, contact support.
          </p>
          {import.meta.env.DEV && this.state.error.message && (
            <pre style={{
              fontSize: 11, color: '#f87171',
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: 8, padding: 10, marginBottom: 20,
              textAlign: 'left', overflow: 'auto', maxHeight: 120,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{this.state.error.message}</pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#16a34a',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
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
