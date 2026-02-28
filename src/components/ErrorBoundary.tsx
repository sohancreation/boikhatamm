import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || "Unknown runtime error" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-xl rounded-lg border border-destructive/30 bg-card p-5">
            <h1 className="text-lg font-semibold text-destructive">Runtime Error</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The app failed to render. Refresh once. If it persists, share the error below.
            </p>
            <pre className="mt-3 rounded bg-muted p-3 text-xs whitespace-pre-wrap break-words">
              {this.state.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
