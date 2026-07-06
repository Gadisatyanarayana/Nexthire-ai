"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Voice Interviewer:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-center max-w-md mx-auto my-12 animate-fade-in-up">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-base font-bold text-red-200 mb-2">Something went wrong</h2>
          <p className="text-xs text-foreground/60 leading-relaxed mb-6">
            An unexpected runtime error occurred within the placement workspace. We&apos;ve logged the error details.
          </p>
          {this.state.error && (
            <pre className="w-full text-left p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] text-red-300/80 overflow-auto max-h-32 mb-6 leading-normal select-text">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-black px-4 py-2.5 text-xs font-bold transition shadow-lg"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
