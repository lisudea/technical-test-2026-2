import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LisLogo } from "@/components/common/brand";
import { LanguageSelector } from "@/components/layout/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-error";
import { authService } from "@/services";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError(t("auth.invalidResetLink"));
      return;
    }
    if (password.length < 12) {
      setError(t("errors.validation"));
      return;
    }
    if (password !== confirmation) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await authService.resetPassword(token, password);
      setComplete(true);
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
          <h1 className="text-xl font-semibold tracking-tight">{t("auth.resetTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.resetSubtitle")}</p>
          {complete ? (
            <div className="mt-6 space-y-5">
              <p className="flex gap-2 rounded-lg bg-success-soft p-4 text-sm text-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {t("auth.resetSuccess")}
              </p>
              <Button asChild className="w-full">
                <Link to="/ingreso">{t("auth.backToLogin")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error ? (
                <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">
                  {error}
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("auth.resetSubmit")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
