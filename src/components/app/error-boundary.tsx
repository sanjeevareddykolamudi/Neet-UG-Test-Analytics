"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
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
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold tracking-tight">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An error occurred while loading this section of the dashboard. This might be due to a network interruption or mismatched data schema.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-full overflow-x-auto rounded bg-muted/80 p-3 text-left text-xs text-destructive-foreground font-mono">
              {this.state.error.message}
            </pre>
          )}
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="mt-6 border-destructive/20 hover:bg-destructive/10 hover:text-destructive-foreground"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
