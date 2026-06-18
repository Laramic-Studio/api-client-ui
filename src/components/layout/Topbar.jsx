import { useEffect, useState } from "react";
import {
  Bell,
  Sun,
  Moon,
  Command as CommandIcon,
  Search,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useLogout } from "@/hooks/use-auth";
import { getErrorMessage, useSwitchTeam } from "@/hooks/use-teams";
import { NAV, AUTH, AI } from "@/constants/testIds";
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

export default function Topbar() {
  const user = useAppStore((s) => s.user);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const aiSidebarOpen = useAppStore((s) => s.aiSidebarOpen);
  const toggleAiSidebar = useAppStore((s) => s.toggleAiSidebar);
  const notifications = useAppStore((s) => s.notifications);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActive = useSwitchTeam();
  const navigate = useNavigate();
  const logout = useLogout();

  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("noidr-theme");
    return stored ? stored === "dark" : true;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("noidr-theme", next ? "dark" : "light");
  };

  const unread = notifications.filter((n) => !n.read).length;
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const switchingId = setActive.isPending ? String(setActive.variables) : null;

  return (
    <div className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-border bg-background">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            data-testid={NAV.workspaceSwitcher + "-top"}
            disabled={setActive.isPending}
            className="inline-flex items-center gap-2 h-9 px-2.5 rounded-md hover:bg-accent/50 text-foreground/90 disabled:opacity-60"
          >
            <div className="h-5 w-5 rounded bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center text-[10px] font-semibold text-foreground">
              {activeWs?.name?.[0] || "N"}
            </div>
            <span className="text-[13px] font-medium">
              {setActive.isPending ? "Switching…" : (activeWs?.name || "Workspace")}
            </span>
            {setActive.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
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

      <button
        onClick={() => setCommandOpen(true)}
        data-testid={NAV.commandKBtn}
        className="ml-2 flex-1 max-w-md h-9 inline-flex items-center gap-2 px-2.5 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground/85 hover:border-white/20 transition-colors text-[12.5px]"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search collections, requests, anything…</span>
        <span className="ml-auto inline-flex items-center gap-1">
          <kbd className="kbd"><CommandIcon className="h-2.5 w-2.5" /></kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </button>

      <div className="ml-auto flex items-center gap-1">
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
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
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
              className="ml-1 h-9 inline-flex items-center gap-2 px-2 rounded-md hover:bg-accent/50"
              data-testid="user-menu-trigger"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22C55E] grid place-items-center text-[11px] font-semibold text-foreground">
                {(user?.name || "U")[0].toUpperCase()}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-[12.5px] font-medium">{user?.name}</div>
                <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{user?.email}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground">
            <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wider">Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="focus:bg-accent/50">
              <UserIcon className="h-3.5 w-3.5" /> Profile & settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-accent" />
            <DropdownMenuItem
              onClick={() => {
                logout.mutate(undefined, {
                  onSettled: () => navigate("/login"),
                });
              }}
              className="focus:bg-accent/50 text-red-400"
              data-testid={AUTH.logout}
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
