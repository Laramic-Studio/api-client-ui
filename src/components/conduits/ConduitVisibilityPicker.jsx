import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTeamDetail } from "@/hooks/use-teams";
import { useAppStore } from "@/store/useAppStore";
import { Check, ChevronDown, Lock, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const VISIBILITY_OPTIONS = [
  {
    id: "private",
    label: "Private",
    description: "Only you can view and edit",
    icon: Lock,
  },
  {
    id: "team",
    label: "Workspace",
    description: "All workspace members can view and run",
    icon: Users,
  },
  {
    id: "shared",
    label: "Restricted",
    description: "Only selected members can view and run",
    icon: UserCheck,
  },
];

export default function ConduitVisibilityPicker({
  visibility,
  sharedWith = [],
  onChange,
  disabled = false,
  variant = "toolbar",
}) {
  const [open, setOpen] = useState(false);
  const teamId = useAppStore((s) => s.activeWorkspaceId);
  const currentUserId = useAppStore((s) => s.user?.id);
  const { data: team } = useTeamDetail(teamId);

  const members = useMemo(() => {
    return (team?.members || []).filter((m) => {
      const uid = m.user_id ?? m.userId ?? m.id;
      return String(uid) !== String(currentUserId);
    });
  }, [team?.members, currentUserId]);

  const current = VISIBILITY_OPTIONS.find((o) => o.id === visibility) || VISIBILITY_OPTIONS[0];
  const Icon = current.icon;
  const isForm = variant === "form";

  const pickVisibility = (id) => {
    onChange({
      visibility: id,
      sharedWith: id === "shared" ? sharedWith : [],
    });
    if (id !== "shared") setOpen(false);
  };

  const toggleMember = (memberId) => {
    const id = Number(memberId);
    const next = sharedWith.includes(id)
      ? sharedWith.filter((x) => x !== id)
      : [...sharedWith, id];
    onChange({ visibility: "shared", sharedWith: next });
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border bg-background text-left transition-colors",
            "hover:bg-accent/50 disabled:opacity-50 disabled:pointer-events-none",
            isForm
              ? "h-9 w-full px-3 text-[13px]"
              : "h-8 shrink-0 max-w-full px-2 text-[12px]",
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("truncate", !isForm && "hidden sm:inline")}>{current.label}</span>
          {visibility === "shared" && sharedWith.length > 0 && (
            <span className="text-[10px] text-muted-foreground shrink-0">({sharedWith.length})</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={isForm ? "start" : "end"}
        className={cn("p-0", isForm ? "w-[var(--radix-popover-trigger-width)]" : "w-[min(100vw-2rem,320px)]")}
      >
        <div className="p-1">
          {VISIBILITY_OPTIONS.map((opt) => {
            const OptIcon = opt.icon;
            const selected = visibility === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => pickVisibility(opt.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  selected ? "bg-accent/60" : "hover:bg-accent/40",
                )}
              >
                <OptIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{opt.description}</div>
                </div>
                {selected && <Check className="h-4 w-4 shrink-0 text-[hsl(var(--brand))]" />}
              </button>
            );
          })}
        </div>

        {visibility === "shared" && (
          <div className="border-t border-border p-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom px-1 mb-1.5">
              Share with
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-0.5">
              {members.length === 0 ? (
                <div className="text-[11px] text-muted-foreground px-1 py-2">
                  No other members in this workspace.
                </div>
              ) : (
                members.map((m) => {
                  const uid = Number(m.user_id ?? m.userId ?? m.id);
                  const checked = sharedWith.includes(uid);
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] cursor-pointer hover:bg-accent/40",
                        checked && "bg-accent/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(uid)}
                        className="accent-[hsl(var(--brand))]"
                      />
                      <span className="truncate font-medium">{m.name}</span>
                      <span className="text-muted-foreground truncate">{m.email}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
