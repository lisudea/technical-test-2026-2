import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { LisLogo } from "@/components/common/brand";
import { LanguageSelector } from "@/components/layout/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { ApiError } from "@/lib/api-error";
import { dataMode } from "@/services";
import { googleClientId, hasGoogleClientId, loadGoogleIdentityScript } from "@/lib/google-identity";

export const Route = createFileRoute("/ingreso")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · LISource" },
      {
        name: "description",
        content:
          "Accede a LISource con tu cuenta institucional para consultar y reservar equipos del LIS.",
      },
      { property: "og:title", content: "Iniciar sesión · LISource" },
      {
        property: "og:description",
        content: "Acceso a la plataforma de recursos del Laboratorio Integrado de Sistemas.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, login, loginGoogle, roleSelection, selectRole, cancelRoleSelection } = useAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googlePendingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [rolePending, setRolePending] = useState<string | null>(null);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  useEffect(() => {
    if (dataMode !== "api" || !hasGoogleClientId()) return;
    const button = googleButtonRef.current;
    if (!button) return;

    let cancelled = false;
    const initialize = async () => {
      try {
        setGoogleLoading(true);
        setGoogleError(null);
        await loadGoogleIdentityScript();
        if (cancelled || !button || !window.google?.accounts?.id) return;
        button.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: googleClientId(),
          callback: async ({ credential }) => {
            if (!credential || googlePendingRef.current) return;
            googlePendingRef.current = true;
            setGooglePending(true);
            try {
              const next = await loginGoogle(credential);
              if (!cancelled && next) void navigate({ to: "/" });
            } catch (error) {
              if (!cancelled) {
                setErrors({
                  form: t(error instanceof ApiError ? error.messageKey : "errors.unknown"),
                });
              }
            } finally {
              if (!cancelled) setGooglePending(false);
              googlePendingRef.current = false;
            }
          },
        });
        window.google.accounts.id.renderButton(button, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 384,
        });
      } catch {
        if (!cancelled) setGoogleError(t("auth.googleUnavailable"));
      } finally {
        if (!cancelled) setGoogleLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [loginGoogle, navigate, t]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const next: typeof errors = {};
    if (!email.trim()) next.email = t("auth.emailRequired");
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = t("auth.emailInvalid");
    if (!password) next.password = t("auth.passwordRequired");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const nextUser = await login(email, password);
      if (nextUser) void navigate({ to: "/" });
    } catch (error) {
      setErrors({ form: t(error instanceof ApiError ? error.messageKey : "errors.unknown") });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <div className="flex items-center gap-3">
          <LisLogo className="h-11 w-11" />
          <span className="text-lg font-semibold text-sidebar-foreground">LISource</span>
        </div>
        <div className="max-w-md">
          <p className="text-3xl leading-tight font-semibold text-sidebar-foreground">
            {t("app.tagline")}
          </p>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            {t("app.lab")} · {t("app.university")}
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          {t("app.lab")} — {t("app.university")}
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <LisLogo />
              <span className="font-semibold">LISource</span>
            </div>
            <LanguageSelector className="ml-auto" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">{t("auth.welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          {roleSelection ? (
            <section className="mt-7 rounded-lg border border-brand/30 bg-brand-soft/40 p-4">
              <h2 className="font-semibold">{t("auth.roleSelectionTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("auth.roleSelectionText")}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {roleSelection.availableRoles.map((role) => (
                  <Button
                    key={role}
                    type="button"
                    variant="outline"
                    disabled={rolePending !== null}
                    onClick={async () => {
                      setRolePending(role);
                      setErrors({});
                      try {
                        await selectRole(role);
                        void navigate({ to: "/" });
                      } catch (error) {
                        setErrors({
                          form: t(error instanceof ApiError ? error.messageKey : "errors.unknown"),
                        });
                      } finally {
                        setRolePending(null);
                      }
                    }}
                  >
                    {rolePending === role ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t(role === "ADMINISTRADOR" ? "profile.roles.ADMIN" : "profile.roles.USER")}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={cancelRoleSelection}
              >
                {t("common.cancel")}
              </Button>
            </section>
          ) : null}

          {!roleSelection && dataMode === "api" ? (
            <div className="mt-7 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{t("auth.google")}</p>
                {googleLoading ? (
                  <span className="text-xs text-muted-foreground">{t("auth.googleLoading")}</span>
                ) : null}
              </div>
              {hasGoogleClientId() ? (
                <div ref={googleButtonRef} className="min-h-11" />
              ) : (
                <Button type="button" variant="outline" className="w-full" disabled>
                  {t("auth.google")}
                </Button>
              )}
              {googleError ? <p className="text-xs text-danger">{googleError}</p> : null}
              {!hasGoogleClientId() ? (
                <p className="text-xs text-muted-foreground">{t("auth.googleNotConfigured")}</p>
              ) : null}
            </div>
          ) : null}

          {!roleSelection ? (
            <form onSubmit={submit} noValidate className="mt-7 space-y-4">
              {errors.form ? (
                <p
                  role="alert"
                  className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
                >
                  {errors.form}
                </p>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  placeholder={t("auth.emailPlaceholder")}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email ? <p className="text-xs text-danger">{errors.email}</p> : null}
                <p className="text-xs text-muted-foreground">{t("auth.hint")}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    placeholder={t("auth.passwordPlaceholder")}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                    className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password ? <p className="text-xs text-danger">{errors.password}</p> : null}
              </div>

              <div className="flex justify-end">
                <Link
                  to="/recuperar"
                  className="text-sm font-medium text-brand-dark hover:underline"
                >
                  {t("auth.forgot")}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={pending || googlePending}>
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  t("auth.login")
                )}
              </Button>
            </form>
          ) : null}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("app.lab")} · {t("app.university")}
          </p>
        </div>
      </main>
    </div>
  );
}
