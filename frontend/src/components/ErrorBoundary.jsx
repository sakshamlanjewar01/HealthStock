import React, { Component } from 'react';

/**
 * ErrorBoundary
 * -------------
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a clean fallback UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an analytics or logging service here
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-left my-4 shadow-sm max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white font-extrabold shrink-0">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-rose-950">Something went wrong</h3>
              <p className="text-xs text-rose-700 font-semibold mt-0.5">We encountered an error loading this section</p>
            </div>
          </div>
          <div className="p-3 bg-white/70 rounded-xl border border-rose-100/50 mb-4 max-h-32 overflow-y-auto">
            <code className="text-[11px] font-black text-rose-900 leading-normal block whitespace-pre-wrap">
              {this.state.error?.toString() || 'Unknown runtime exception'}
            </code>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-extrabold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
