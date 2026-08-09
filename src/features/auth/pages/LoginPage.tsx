import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, ShieldCheck, AlertCircle, Microscope } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const ALLOWED_DOMAIN = 'udea.edu.co';

interface CredentialResponse {
  credential: string;
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('gis-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('network'));
    document.head.appendChild(script);
  });
}

function decodeJwtEmail(idToken: string): string | null {
  try {
    const payload = idToken.split('.')[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return decoded?.email ?? null;
  } catch {
    return null;
  }
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [scriptError, setScriptError] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        const google = (window as unknown as { google?: { accounts: { id: { initialize: (cfg: unknown) => void; renderButton: (el: HTMLElement, opts: unknown) => void } } } }).google;
        if (!google || googleInitialized.current) return;
        googleInitialized.current = true;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: CredentialResponse) => {
            void handleCredential(response.credential);
          },
        });
        if (buttonRef.current) {
          google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            locale: t('common.language') === 'en' ? 'en' : 'es',
            width: 280,
          });
        }
      })
      .catch(() => setScriptError(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleCredential(idToken: string) {
    setLocalError(null);
    const email = decodeJwtEmail(idToken);
    if (email && !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      setLocalError(t('auth.domainError'));
      toast.error(t('auth.domainError'));
      return;
    }
    try {
      await login(idToken);
      const from = params.get('from');
      navigate(from ? from : '/', { replace: true });
    } catch (err) {
      const msg = errorMessage(err, t('auth.authError'));
      setLocalError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:py-20">
      <Card className="w-full animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-dark">
            <Microscope className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-ink">{t('auth.loginTitle')}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{t('auth.loginSubtitle')}</p>
        </div>

        {scriptError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-state-reservado/25 bg-state-reservado/5 p-3 text-sm text-state-reservado">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{t('auth.networkError')}</span>
          </div>
        )}

        {localError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-state-reservado/25 bg-state-reservado/5 p-3 text-sm text-state-reservado">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{localError}</span>
          </div>
        )}

        {clientId ? (
          <div className="flex flex-col items-center gap-4">
            <div ref={buttonRef} className="flex justify-center" />
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Spinner />
                <span>{t('auth.loadingGoogle')}</span>
              </div>
            )}
          </div>
        ) : (
          // Demo fallback when no Google client id is configured.
          <div className="flex flex-col items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={isLoading}
              onClick={() => {
                setLocalError(t('auth.domainError'));
                toast.error(t('auth.domainError'));
              }}
              iconLeft={<LogIn className="h-5 w-5" aria-hidden />}
            >
              {t('auth.signInGoogle')}
            </Button>
            <p className="text-center text-xs text-ink-muted">
              {t('auth.loginPromptDetail')}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-surface-line pt-4 text-xs text-ink-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-state-disponible" aria-hidden />
          {t('auth.secureNote')}
        </div>
      </Card>

      <p className="mt-4 text-center text-xs text-ink-muted">
        {t('auth.loginPromptDetail')}
      </p>
    </div>
  );
}
