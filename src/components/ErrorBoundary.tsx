import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-state-reservado/20 bg-state-reservado/5 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-state-reservado/10 text-state-reservado">
            <AlertTriangle className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Algo salió mal</h2>
            <p className="mt-1 text-sm text-ink-muted">{this.state.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
