import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { EnterpriseLogger } from '../database/services/EnterpriseLogger';

type Props = {
  children: ReactNode;
  onExit?: () => void;
};

type State = {
  error: Error | null;
  retryKey: number;
};

export default class ExamsErrorBoundary extends Component<Props, State> {
  public state: State = { error: null, retryKey: 0 };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    EnterpriseLogger.error('Exams module render failed', 'ExamsErrorBoundary', {
      error: error.message,
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  public render() {
    const props = (this as any).props as Props;
    if (this.state.error) {
      return (
        <section dir="rtl" role="alert" className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
          <h2 className="text-xl font-black">تعذر تحميل وحدة الامتحانات</h2>
          <p className="mt-2 text-sm font-bold">تم إيقاف الشاشة بأمان لمنع عرض حالة ناقصة أو فقد أي بيانات.</p>
          <p className="mx-auto mt-3 max-w-2xl rounded-xl border border-rose-200 bg-white p-3 font-mono text-xs" dir="ltr">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-rose-700 px-5 py-2.5 text-xs font-black text-white"
              onClick={() => (this as any).setState(({ retryKey }: State) => ({ error: null, retryKey: retryKey + 1 }))}
            >
              إعادة المحاولة
            </button>
            {props.onExit && (
              <button type="button" className="rounded-xl border border-rose-300 bg-white px-5 py-2.5 text-xs font-black" onClick={props.onExit}>
                العودة للرئيسية
              </button>
            )}
          </div>
        </section>
      );
    }

    return <React.Fragment key={this.state.retryKey}>{props.children}</React.Fragment>;
  }
}
