import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";

const searchSchema = z.object({
  token: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: searchSchema,
  component: AuthCallback,
});

function AuthCallback() {
  const { token, email, role } = Route.useSearch();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (token && email && role) {
      login(token, email, role);
    }
    void navigate({ to: "/", replace: true });
  }, [token, email, role]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">
      Iniciando sesión...
    </div>
  );
}