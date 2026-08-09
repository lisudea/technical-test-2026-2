import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LisLogo } from "@/components/common/brand";
import { LanguageSelector } from "@/components/layout/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { ApiError } from "@/lib/api-error";

export const Route = createFileRoute("/recuperar")({
  head: () => ({
    meta: [
      { title: "Recuperar contraseña · LISource" },
      {
        name: "description",
        content:
          "Solicita instrucciones para restablecer la contraseña de tu cuenta institucional en LISource.",
      },
      { property: "og:title", content: "Recuperar contraseña · LISource" },
      {
        property: "og:description",
        content: "Restablece el acceso a la plataforma de recursos del LIS.",
      },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError(t("auth.emailInvalid"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await authService.requestPasswordRecovery(email);
      setSent(true);
    } catch (cause) {
      setError(t(cause instanceof ApiError ? cause.messageKey : "errors.unknown"));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LisLogo />
            <span className="font-semibold">LISource</span>
          </div>
          <LanguageSelector />
        </div>

        <div className="surface-card p-6 sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.recoverTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.recoverSubtitle")}</p>

          {sent ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-success/25 bg-success-soft p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <p className="text-sm text-success">{t("auth.recoverSent")}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recover-email">{t("auth.email")}</Label>
                <Input
                  id="recover-email"
                  type="email"
                  value={email}
                  placeholder={t("auth.emailPlaceholder")}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
                {error ? <p className="text-xs text-danger">{error}</p> : null}
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {t("auth.recoverSubmit")}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/ingreso" className="text-sm font-medium text-brand-dark hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
