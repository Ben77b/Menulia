"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ClientErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  onReset?: () => void;
}

interface ClientErrorBoundaryState {
  error: Error | null;
}

export class ClientErrorBoundary extends Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ClientErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ClientErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="air-card air-card-pad mx-auto max-w-lg text-center">
          <h2 className="air-section-title">{this.props.title ?? "Something went wrong"}</h2>
          <p className="air-page-subtitle mt-2">
            This section failed to load. You can try again or refresh the page.
          </p>
          <Button className="mt-4" variant="dark" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
