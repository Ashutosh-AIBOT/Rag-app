"use client";
import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="card p-8 text-center space-y-4">
          <div className="text-rose-400 text-sm font-semibold">Something went wrong</div>
          <p className="text-xs text-zinc-500">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="btn-primary text-xs"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
