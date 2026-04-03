import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: 40,
            maxWidth: 500
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={40} color="#ef4444" />
            </div>
            <h2 style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 12,
              color: '#fff'
            }}>
              抱歉，发生了错误
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 32,
              lineHeight: 1.6
            }}>
              应用程序遇到了一个未知错误，请尝试刷新页面或返回首页。
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
              >
                <RefreshCw size={16} />
                刷新页面
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                返回首页
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginTop: 32,
                textAlign: 'left',
                padding: 16,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                <summary style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
                  错误详情（开发模式）
                </summary>
                <pre style={{
                  marginTop: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
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
