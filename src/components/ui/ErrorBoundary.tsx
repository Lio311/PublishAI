"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          name={this.props.name}
          error={this.state.error}
          componentStack={this.state.errorInfo?.componentStack ?? null}
          showDetails={this.state.showDetails}
          onReset={this.handleReset}
          onToggleDetails={this.toggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

/** Function component so the fallback can use translations (class components cannot use hooks). */
function ErrorFallback({
  name,
  error,
  componentStack,
  showDetails,
  onReset,
  onToggleDetails,
}: {
  name?: string;
  error: Error | null;
  componentStack: string | null;
  showDetails: boolean;
  onReset: () => void;
  onToggleDetails: () => void;
}) {
  const t = useTranslations("Errors.boundary");
  return (
    <div className="p-6 rounded-2xl bg-red-50/70 border border-red-200/80 shadow-xs my-4 backdrop-blur-xs">
      <div className="flex items-start gap-4">
        <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-red-900">{name ? t("titleIn", { name }) : t("title")}</h3>
          <p className="text-sm text-red-700 mt-1 leading-relaxed">{error?.message || t("description")}</p>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t("retry")}</span>
            </button>

            <button
              onClick={onToggleDetails}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 transition-colors cursor-pointer"
            >
              <span>{t("details")}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showDetails && (
            <div className="mt-3 p-3 bg-red-950/90 text-red-100 rounded-lg text-xs font-mono overflow-auto max-h-48 border border-red-800" dir="ltr">
              <p className="font-bold text-red-300">{error?.toString()}</p>
              {componentStack && <pre className="mt-2 whitespace-pre-wrap opacity-80 text-[11px]">{componentStack}</pre>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
