import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { queryClient } from '@/lib/query';
import i18n from '@/i18n/i18n';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRoutes } from '@/app/routes';

export function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
