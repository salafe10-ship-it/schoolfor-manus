import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
      return (
        <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200">
          <h2 className="text-xl font-bold">حدث خطأ في تحميل وحدة المحاسبة</h2>
          <p className="mt-2 text-sm font-mono text-left max-w-lg mx-auto bg-gradient-to-b from-[#fffefc] via-[#fbf8f0] to-[#f5eeea] border-2 border-[#d4af37]/30 hover:border-[#d4af37] rounded-3xl p-4 sm:p-5 shadow-md transition-all duration-300">{this.state.error?.message}</p>
          <p className="mt-4">يرجى التواصل مع الدعم الفني.</p>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
