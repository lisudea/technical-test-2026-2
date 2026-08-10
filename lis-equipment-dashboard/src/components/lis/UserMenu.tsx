import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const backendOrigin = import.meta.env["VITE_BACKEND_ORIGIN"] as string | undefined;

  if (!user) {
    return (
      <Button asChild size="sm" className="rounded-full">
        <a href={backendOrigin ?? "/"}>
          <LogIn className="mr-1.5 h-4 w-4" />
          {t("auth.login")}
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="glass rounded-full gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="max-w-[140px] truncate">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass rounded-2xl">
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {user.role}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {t("auth.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}