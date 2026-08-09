import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useCallback, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import i18n, { readStoredLanguage } from "@/i18n";
import { AuthProvider } from "@/features/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { useTranslation } from "react-i18next";
import { LisLogo } from "@/components/common/brand";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <LisLogo className="h-14 w-14" />
        <p className="mt-3 text-sm font-semibold tracking-tight">LISource</p>
        <h1 className="mt-6 text-5xl font-bold text-brand">404</h1>
        <h2 className="mt-3 text-xl font-semibold text-foreground">{t("notFound.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("notFound.text")}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("notFound.action")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errors.pageLoadTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("errors.pageLoadText")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("common.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("notFound.action")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Panel de recursos · LISource" },
      {
        name: "description",
        content:
          "Panel general del Laboratorio Integrado de Sistemas: equipos disponibles, reservados y en mantenimiento.",
      },
      { name: "author", content: "Laboratorio Integrado de Sistemas" },
      { property: "og:title", content: "Panel de recursos · LISource" },
      {
        property: "og:description",
        content:
          "Panel general del Laboratorio Integrado de Sistemas: equipos disponibles, reservados y en mantenimiento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Panel de recursos · LISource" },
      {
        name: "twitter:description",
        content:
          "Panel general del Laboratorio Integrado de Sistemas: equipos disponibles, reservados y en mantenimiento.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/68ea5ea6d4be1bfccb9aa84ced6894c4/id-preview-314be7a6--04e2b723-5878-4d19-a4c7-76bed1b6b0d8.lovable.app-1786150994288.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/68ea5ea6d4be1bfccb9aa84ced6894c4/id-preview-314be7a6--04e2b723-5878-4d19-a4c7-76bed1b6b0d8.lovable.app-1786150994288.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/lisource-penguin.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const language = i18n.resolvedLanguage ?? i18n.language ?? "es";
  return (
    <html lang={language}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const handleLoggedOut = useCallback(
    () => router.navigate({ to: "/ingreso", replace: true }),
    [router],
  );

  useEffect(() => {
    const stored = readStoredLanguage();
    if (stored && stored !== i18n.resolvedLanguage) void i18n.changeLanguage(stored);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onLoggedOut={handleLoggedOut}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
