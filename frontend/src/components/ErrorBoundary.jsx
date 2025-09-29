import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // You can also log to an error reporting service here
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Result
            status="500"
            title="Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
            extra={[
              <Button type="primary" onClick={this.handleReset} key="home">
                Go to Dashboard
              </Button>,
              <Button onClick={() => window.location.reload()} key="reload">
                Refresh Page
              </Button>,
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '20px' }}>
                <summary style={{ cursor: 'pointer' }}>Error Details (Development Only)</summary>
                <pre style={{ color: 'red', marginTop: '10px' }}>
                  {this.state.error.toString()}
                </pre>
                <pre style={{ color: '#666', fontSize: '12px' }}>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
