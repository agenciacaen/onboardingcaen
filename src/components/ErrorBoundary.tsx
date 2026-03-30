import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return { hasError: true, errorMsg: error.name + ': ' + error.message + '\n\nStack:\n' + error.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Erro Crítico na Interface
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                O aplicativo encontrou um erro inesperado ao renderizar este componente. Por favor, tire um print dessa tela para o suporte técnico.
              </p>
              
              <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-md overflow-x-auto text-xs font-mono text-red-600 dark:text-red-400 mb-6">
                <pre>{this.state.errorMsg}</pre>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Voltar para Home
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Recarregar Página
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
