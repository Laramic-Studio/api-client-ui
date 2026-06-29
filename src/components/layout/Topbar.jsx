import {
  Bell,
  Sun,
  Moon,
  Command as CommandIcon,
  Search,
  ChevronDown,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useTheme } from "@/hooks/use-theme";
import { getErrorMessage, useSwitchTeam } from "@/hooks/use-teams";
import { NAV, AI } from "@/constants/testIds";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StackedLogo } from "@/components/layout/stack-logo";

export default function Topbar() {
  const companyLogo = useAppStore((s) => s.user?.company?.logo);
  const companyName = useAppStore((s) => s.user?.company?.name);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const aiSidebarOpen = useAppStore((s) => s.aiSidebarOpen);
  const toggleAiSidebar = useAppStore((s) => s.toggleAiSidebar);
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActive = useSwitchTeam();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const unread = notifications.filter((n) => !n.read).length;
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const switchingId = setActive.isPending ? String(setActive.variables) : null;

  return (
    <div className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 border-b border-border bg-background">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="h-9 w-9 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden shrink-0"
          data-testid="brand-logo"
          title={companyName || "Noidr Web"}
        >
          {companyLogo ? (
            <img src={companyLogo} alt={companyName || "Company"} className="h-full w-full object-cover" />
          ) : (
            <StackedLogo className="h-4 w-4 text-white" />
          )}
        </button>
        <div className="text-[15px] font-medium tracking-tight truncate hidden sm:block">
          {companyName || (
            <>
              <span>noidr</span>
              <span className="text-[hsl(var(--brand))]">.</span>
              <span>web</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setCommandOpen(true)}
        data-testid={NAV.commandKBtn}
        className="w-full max-w-md h-9 inline-flex items-center gap-2 px-2.5 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground/85 hover:border-white/20 transition-colors text-[12.5px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search collections, requests, anything…</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <kbd className="kbd"><CommandIcon className="h-2.5 w-2.5" /></kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </button>

      <div className="flex items-center justify-end gap-1">
        <button
          onClick={toggleAiSidebar}
          data-testid={AI.toggle}
          className={cn(
            "h-9 w-9 grid place-items-center rounded-md hover:bg-accent/50 text-foreground/85",
            aiSidebarOpen && "bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]",
          )}
          aria-label="Toggle AI assistant"
          title="Assistant (⌘J)"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        <button
          onClick={toggleTheme}
          data-testid={NAV.themeToggle}
          className="h-9 w-9 grid place-items-center rounded-md hover:bg-accent/50 text-foreground/85"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button
              data-testid={NAV.notifications}
              className="relative h-9 w-9 grid place-items-center rounded-md hover:bg-accent/50 text-foreground/85"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--brand))]" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 bg-card border-border text-foreground"
          >
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="text-[13px] font-medium">Notifications</div>
              <button
                onClick={markAllRead}
                className="text-[11px] text-muted-foreground hover:text-foreground"
                data-testid="notifications-mark-read"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 && (
                <div className="p-6 text-center text-[12px] text-muted-foreground">No notifications yet</div>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="p-3 flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                      n.type === "success" && "bg-[hsl(var(--success))]",
                      n.type === "warning" && "bg-[hsl(var(--warning))]",
                      n.type === "danger" && "bg-[hsl(var(--danger))]",
                      n.type === "info" && "bg-[hsl(var(--brand))]"
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium">{n.title}</div>
                    <div className="text-[12px] text-muted-foreground">{n.desc}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-geom uppercase tracking-wider">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {!n.read && <Badge className="ml-auto bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))] border-0 text-[10px]">New</Badge>}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid={NAV.workspaceSwitcher + "-top"}
              disabled={setActive.isPending}
              className="ml-1 h-9 inline-flex items-center gap-2 px-2 rounded-md hover:bg-accent/50 text-foreground/90 disabled:opacity-60"
            >
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center text-[11px] font-semibold text-foreground">
                {activeWs?.name?.[0] || "N"}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-[12.5px] font-medium">
                  {setActive.isPending ? "Switching…" : (activeWs?.name || "Workspace")}
                </div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                  {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
                </div>
              </div>
              {setActive.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-card border-border text-foreground"
          >
            <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wider">
              Workspaces
            </DropdownMenuLabel>
            {workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                disabled={setActive.isPending}
                onClick={() => {
                  if (w.id === activeWorkspaceId || setActive.isPending) return;
                  setActive.mutate(w.id, {
                    onError: (err) => toast.error(getErrorMessage(err, "Could not switch workspace.")),
                  });
                }}
                className="cursor-pointer focus:bg-accent/50"
                data-testid={`topbar-ws-${w.id}`}
              >
                <div className="h-5 w-5 rounded bg-accent grid place-items-center text-[10px]">
                  {w.name[0]}
                </div>
                <span className="flex-1 truncate">{w.name}</span>
                {switchingId === w.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : w.id === activeWorkspaceId ? (
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />
                ) : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-accent" />
            <DropdownMenuItem onClick={() => navigate("/workspaces")} className="focus:bg-accent/50">
              Manage workspaces
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
