import { cn } from "@/lib/utils";

export const LISOURCE_LOGO_PATH = "/lisource-penguin.png";

export function LisLogo({ className }: { className?: string }) {
  return (
    <img
      src={LISOURCE_LOGO_PATH}
      alt="Laboratorio Integrado de Sistemas"
      className={cn("h-10 w-10 shrink-0 object-contain", className)}
      width={40}
      height={40}
    />
  );
}

export function BrandLockup({
  className,
  subtitle,
  tone = "light",
}: {
  className?: string;
  subtitle?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LisLogo />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-base font-semibold tracking-tight",
            tone === "dark" ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          LISource
        </p>
        {subtitle ? (
          <p
            className={cn(
              "truncate text-xs",
              tone === "dark" ? "text-sidebar-foreground/60" : "text-muted-foreground",
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
