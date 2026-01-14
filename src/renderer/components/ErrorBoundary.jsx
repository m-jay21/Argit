import React from 'react';
import { ErrorIcon, LoadingSpinnerIcon } from './icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    // Reset error state and try to reload the component
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-bg-primary p-5 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-bg-secondary border border-border-light p-6 rounded-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ErrorIcon className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h2>

            <p className="text-text-secondary mb-4">
              The application encountered an unexpected error. This might be temporary.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                <LoadingSpinnerIcon className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-text-secondary cursor-pointer hover:text-text-primary">
                  Error Details (Development)
                </summary>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
                  <pre className="text-red-800 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;