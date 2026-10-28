import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'เกิดข้อผิดพลาดในการแสดงผล' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Siby Classroom Caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-3xl mx-auto border border-sky-400/30">
              🐺
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">ไซบี้พร้อมช่วยเหลือครับ</h2>
              <p className="text-xs text-slate-400 mt-1">
                ตรวจพบข้อขัดข้องชั่วคราวในการแสดงผลหน้าเว็บ
              </p>
            </div>

            {this.state.errorMessage && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-rose-300 font-mono text-left break-words">
                {this.state.errorMessage}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
              >
                🔄 โหลดหน้าเว็บใหม่
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                รีเซ็ตแคชข้อมูล
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
