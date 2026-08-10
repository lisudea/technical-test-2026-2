import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { LanguageSelector } from "@/components/layout/language-selector";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/auth-context";
import { revokeSessionOrLogout } from "@/features/auth/session-actions";
import {
  absoluteDate,
  displayIp,
  friendlyDeviceName,
  relativeDate,
  sessionActivity,
} from "@/features/auth/session-display";
import { ApiError } from "@/lib/api-error";
import { authService } from "@/services";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil · LISource" },
      {
        name: "description",
        content: "Datos de tu cuenta institucional e idioma preferido en LISource.",
      },
      { property: "og:title", content: "Mi perfil · LISource" },
      {
        property: "og:description",
        content: "Consulta tus datos de usuario y preferencias en LISource.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, ready, logout, logoutAll, updateProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const locale = i18n.resolvedLanguage ?? "es";

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => authService.activeSessions(),
    enabled: Boolean(user),
  });
  const saveProfile = useMutation({
    mutationFn: () => updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }),
    onSuccess: (updated) => {
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      toast.success(t("profile.updateSuccess"));
    },
    onError: (error) => {
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    },
  });
  const revokeSession = useMutation({
    mutationFn: (session: NonNullable<typeof sessions.data>[number]) =>
      revokeSessionOrLogout(session, {
        logout,
        revokeSession: (sessionId) => authService.revokeSession(sessionId),
      }),
    onSuccess: (result) => {
      if (result === "revoked") {
        toast.success(t("profile.sessionRevoked"));
        void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      }
    },
    onError: (error) =>
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown")),
  });
  const logoutOthers = useMutation({
    mutationFn: () => authService.logoutOthers(),
    onSuccess: () => {
      toast.success(t("profile.otherSessionsClosed"));
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) =>
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown")),
  });

  useEffect(() => {
    if (ready && !user) void navigate({ to: "/ingreso", replace: true });
  }, [ready, user, navigate]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  if (!ready || !user) return null;

  const unchanged = firstName.trim() === user.firstName && lastName.trim() === user.lastName;
  const invalid = !firstName.trim() || !lastName.trim();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invalid && !saveProfile.isPending) saveProfile.mutate();
  };

  return (
    <AppShell title={t("profile.title")}>
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <section className="surface-card p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-lg font-semibold text-brand-dark">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="break-all text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">{t("profile.firstName")}</Label>
              <Input
                id="profile-first-name"
                value={firstName}
                maxLength={100}
                required
                autoComplete="given-name"
                disabled={saveProfile.isPending}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">{t("profile.lastName")}</Label>
              <Input
                id="profile-last-name"
                value={lastName}
                maxLength={100}
                required
                autoComplete="family-name"
                disabled={saveProfile.isPending}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="inline-flex items-center gap-1.5">
                {t("profile.email")} <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              </Label>
              <Input id="profile-email" value={user.email} readOnly aria-readonly="true" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role" className="inline-flex items-center gap-1.5">
                {t("profile.role")} <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              </Label>
              <Input
                id="profile-role"
                value={t(`profile.roles.${user.role}`)}
                readOnly
                aria-readonly="true"
              />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" disabled={invalid || unchanged || saveProfile.isPending}>
                {saveProfile.isPending ? t("profile.saving") : t("profile.saveChanges")}
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="surface-card p-6">
            <h2 className="text-base font-semibold">{t("profile.preferredLanguage")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.languageText")}</p>
            <div className="mt-3">
              <LanguageSelector />
            </div>
          </section>
          <section className="surface-card p-6">
            <h2 className="inline-flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4.5 w-4.5 text-brand-dark" aria-hidden="true" />
              {t("profile.security")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("profile.securityText")}</p>
          </section>
        </aside>
      </div>

      <section className="surface-card mt-5 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{t("profile.activeSessions")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.activeSessionsText")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(sessions.data?.length ?? 0) > 1 ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={logoutOthers.isPending}
                onClick={() => logoutOthers.mutate()}
              >
                {t("profile.closeOtherSessions")}
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => void logoutAll()}>
              {t("profile.closeAllSessions")}
            </Button>
          </div>
        </div>
        <div className="mt-4 divide-y divide-border">
          {sessions.isLoading ? <p className="py-4 text-sm">{t("common.loading")}</p> : null}
          {sessions.isError ? (
            <p className="py-4 text-sm text-destructive">{t("profile.sessionsError")}</p>
          ) : null}
          {sessions.data?.map((session) => {
            const ip = displayIp(session.ipAddress);
            return (
              <div
                key={session.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium" title={session.userAgent}>
                    {friendlyDeviceName(session.userAgent)}
                    {session.current ? (
                      <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand-dark">
                        {t("profile.currentSession")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {t("profile.lastActivity")}: {relativeDate(sessionActivity(session), locale)}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {t("profile.expires")}: {absoluteDate(session.expiresAt, locale)}
                    {ip ? ` · ${t("profile.ipAddress")}: ${ip}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={revokeSession.isPending}
                  onClick={() => revokeSession.mutate(session)}
                >
                  {session.current ? t("navigation.logout") : t("profile.revokeSession")}
                </Button>
              </div>
            );
          })}
          {!sessions.isLoading && !sessions.isError && sessions.data?.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("profile.noSessions")}</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
