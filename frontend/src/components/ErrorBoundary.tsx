import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, errorInfo: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#000', color: '#ff4444', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', borderBottom: '1px solid #ff4444', paddingBottom: '0.5rem' }}>
            UI CRASH DETECTED
          </h2>
          <p style={{ marginBottom: '1rem' }}>The application encountered an unexpected error. Please check the console for details.</p>
          <details style={{ whiteSpace: 'pre-wrap', background: '#111', padding: '1rem', border: '1px solid #333' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>Show Error Details</summary>
            <div style={{ marginTop: '1rem' }}>
              <strong>{this.state.error && this.state.error.toString()}</strong>
              <br /><br />
              {this.state.errorInfo?.componentStack}
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#ff4444', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            RELOAD APPLICATION
          </button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
