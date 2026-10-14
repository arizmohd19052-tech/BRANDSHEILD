/**
 * [client/src/components/ErrorBoundary.tsx]
 * React Error Boundary component for BrandShield AI views.
 * Catches unhandled rendering exceptions, prevents full-page blank screens,
 * and provides friendly recovery controls with file-tagged diagnostic information.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button.js';
import { Card } from './ui/Card.js';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      '[client/src/components/ErrorBoundary.tsx] Uncaught view exception caught by boundary:',
      error,
      errorInfo
    );
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Component Encountered a Problem';
      const errorMessage = this.state.error?.message || 'An unexpected rendering error occurred.';

      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 my-6">
          <Card className="border-[#DC2626]/40 bg-[#FEF2F2] dark:bg-[#451A1A]/30 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="text-base font-bold text-[#991B1B] dark:text-[#FCA5A5]">
                    {title}
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#DC2626]/10 text-[#991B1B] dark:text-[#FCA5A5]">
                    [ErrorBoundary]
                  </span>
                </div>
                <p className="text-xs text-[#7F1D1D] dark:text-[#FECACA] mb-3">
                  {errorMessage}
                </p>

                {this.state.errorInfo && (
                  <details className="mt-2 text-[11px] text-[#5B6675] dark:text-[#8B97A7] bg-white/70 dark:bg-[#121B25]/80 p-3 rounded border border-[#E3DFD6] dark:border-[#243140] font-mono overflow-auto max-h-40">
                    <summary className="cursor-pointer font-medium mb-1 select-none text-[#0F1B2D] dark:text-[#E8EDF2]">
                      Technical Stack Details
                    </summary>
                    <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
                  </details>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={this.handleReset}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Try Reloading View
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
