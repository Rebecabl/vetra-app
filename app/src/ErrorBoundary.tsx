import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  
  resetKeys?: unknown[];
  
  onReset?: () => void;
};

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: React.ErrorInfo) {

  }

  componentDidUpdate(prevProps: Props) {
   
    if (this.state.hasError) {
      const { resetKeys = [] } = this.props;
      const { resetKeys: prevResetKeys = [] } = prevProps;
      if (resetKeys.length !== prevResetKeys.length ||
          resetKeys.some((k, i) => k !== prevResetKeys[i])) {
        this.setState({ hasError: false, error: undefined });
      }
    }
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
      this.setState({ hasError: false, error: undefined });
    } else {
      // fallback simples
      location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              Ocorreu um erro inesperado
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Recarregue a página. Se persistir, verifique o console do navegador.
            </p>

            {import.meta.env.DEV && this.state.error ? (
              <pre className="mt-4 max-h-60 overflow-auto rounded bg-slate-100 p-3 text-left text-xs text-red-700 dark:bg-slate-800 dark:text-red-300">
                {this.state.error?.message}
              </pre>
            ) : null}

            <button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
