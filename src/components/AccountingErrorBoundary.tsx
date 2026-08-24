import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AccountingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Accounting module error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const { title, description, retryLabel, onRetry } = (this as any).props as Props;
      return (
        <div className="p-8 text-center text-red-700 bg-red-50 border border-red-200 rounded-2xl" role="alert">
          <h2 className="text-xl font-bold">{title || 'حدث خطأ في تحميل وحدة المحاسبة'}</h2>
          <p className="mt-2 text-sm font-semibold">{description || 'تعذر تحميل الشاشة الحالية. أعد المحاولة قبل التواصل مع الدعم الفني.'}</p>
          <p className="mt-2 text-sm font-mono text-left max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">{this.state.error?.message}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white hover:bg-slate-800"
            onClick={() => {
              if (onRetry) {
                onRetry();
                return;
              }
              (this as any).setState({ hasError: false, error: undefined });
            }}
          >
            {retryLabel || 'إعادة محاولة التحميل'}
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
