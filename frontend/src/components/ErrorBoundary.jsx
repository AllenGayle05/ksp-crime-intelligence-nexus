import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }} className="glass-card">
          <strong>Analytics data unavailable</strong>
          <div style={{ color: '#9fb0d9', marginTop: 8 }}>There was a problem rendering this chart.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
