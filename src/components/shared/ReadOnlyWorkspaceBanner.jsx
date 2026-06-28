import { Eye } from "lucide-react";
import { READ_ONLY_BANNER_DESCRIPTION } from "@/lib/permissions";
import { useTeamPermissions } from "@/hooks/use-team-permissions";
import { cn } from "@/lib/utils";

export default function ReadOnlyWorkspaceBanner({ className, compact = false }) {
  const { isReadOnly, roleLabel, isLoading } = useTeamPermissions();

  if (isLoading || !isReadOnly) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-md border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/8 text-[12.5px]",
        compact ? "px-3 py-2" : "px-4 py-3",
        className,
      )}
      role="status"
    >
      <Eye className="h-4 w-4 shrink-0 text-[hsl(var(--warning))] mt-0.5" />
      <div className="min-w-0">
        <div className="font-medium text-foreground">
          Read-only workspace{roleLabel ? ` — ${roleLabel}` : ""}
        </div>
        <p className="mt-0.5 text-muted-foreground leading-relaxed">
          {READ_ONLY_BANNER_DESCRIPTION}
        </p>
      </div>
    </div>
  );
}
