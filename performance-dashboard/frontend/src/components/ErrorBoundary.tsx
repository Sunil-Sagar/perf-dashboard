import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '2rem',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
        }}>
          <h2 style={{ color: '#ef4444' }}>ERROR: Something went wrong</h2>
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details (click to expand)
            </summary>
            <pre style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}>
              {this.state.error && this.state.error.toString()}
              {'\n\n'}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
