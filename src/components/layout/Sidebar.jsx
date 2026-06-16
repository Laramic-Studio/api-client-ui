import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FolderTree,
  Send,
  Boxes,
  ServerCog,
  BookOpenText,
  History as HistoryIcon,
  Activity,
  Briefcase,
  Settings as SettingsIcon,
  Users,
  Workflow,
  Sparkles,
  Upload,
  ChevronsLeft,
  ChevronsRight,
  Search,
  PanelsTopLeft,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { NAV } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo } from "react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard", key: "dashboard" },
  { to: "/collections", icon: FolderTree, label: "Collections", key: "collections" },
  { to: "/builder", icon: Send, label: "APIs", key: "apis" },
  { to: "/environments", icon: Boxes, label: "Environments", key: "environments" },
  { to: "/mock-servers", icon: ServerCog, label: "Mock Servers", key: "mock-servers" },
  { to: "/documentation", icon: BookOpenText, label: "Documentation", key: "documentation" },
  { to: "/history", icon: HistoryIcon, label: "History", key: "history" },
  { to: "/monitoring", icon: Activity, label: "Monitoring", key: "monitoring" },
  { to: "/workspaces", icon: Briefcase, label: "Workspaces", key: "workspaces", enabled: true },
];

const SECONDARY = [
  { to: "/team", icon: Users, label: "Team", key: "team", enabled: true },
  { to: "/conduits", icon: Workflow, label: "Conduits", key: "conduits" },
  { to: "/generators", icon: Sparkles, label: "Generators", key: "generators" },
  { to: "/import", icon: Upload, label: "Import API", key: "import" },
  { to: "/settings", icon: SettingsIcon, label: "Settings", key: "settings", enabled: true },
];

const LOCKED_REASON = "Not available yet. This module is still being built for the web app.";

const isNavEnabled = (item) => item.enabled === true;

export default function Sidebar({ collapsed }) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const companyLogo = useAppStore((s) => s.user?.company?.logo);
  const companyName = useAppStore((s) => s.user?.company?.name);
  const [q, setQ] = useState("");

  const all = useMemo(() => [...NAV_ITEMS, ...SECONDARY], []);
  const filtered = q ? all.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Logo + collapse */}
      <div className={cn("h-14 flex items-center border-b border-border", collapsed ? "px-2 justify-center" : "px-3 gap-1")}>
        <button
          type="button"
          className="flex items-center gap-2 group cursor-default"
          data-testid="brand-logo"
          title="Noidr Web"
        >
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName || "Company"} className="h-full w-full object-cover" />
            ) : (
              <PanelsTopLeft className="h-4 w-4 text-white" strokeWidth={2} />
            )}
          </div>
          {!collapsed && (
            <div className="text-[15px] font-medium tracking-tight truncate max-w-[140px]">
              {companyName || (<><span>noidr</span><span className="text-[hsl(var(--brand))]">.</span><span>web</span></>)}
            </div>
          )}
        </button>
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            data-testid={NAV.collapseToggle}
            aria-label="Collapse sidebar"
            title="Collapse (⌘B)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="mx-auto my-2 h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              data-testid={NAV.collapseToggle}
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border border-border bg-popover text-foreground">
            Expand sidebar
          </TooltipContent>
        </Tooltip>
      )}

     
      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter navigation"
              data-testid={NAV.search}
              className="w-full h-8 pl-8 pr-2 rounded-md bg-muted border border-border text-[12px] text-foreground placeholder:text-muted-foreground ring-focus focus:border-[hsl(var(--brand))]"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {(filtered ?? NAV_ITEMS).map((it) => (
          <NavRow key={it.key} item={it} collapsed={collapsed} />
        ))}
        {!filtered && (
          <>
            <div className={cn("mt-4 mb-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground", collapsed && "hidden")}>Tools</div>
            {SECONDARY.map((it) => (
              <NavRow key={it.key} item={it} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Workspace mini list */}
      {/* {!collapsed && (
        <div className="border-t border-border p-2 max-h-44 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">Switch workspace</div>
          {workspaces.slice(0, 5).map((w) => (
            <button
              key={w.id}
              onClick={() => setActive(w.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md text-[12px] flex items-center gap-2 hover:bg-accent/50",
                w.id === activeWorkspaceId && "bg-accent/50 text-foreground"
              )}
              data-testid={`ws-switch-${w.id}`}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full", w.id === activeWorkspaceId ? "bg-[hsl(var(--brand))]" : "bg-muted-foreground/50")} />
              <span className="truncate">{w.name}</span>
            </button>
          ))}
        </div>
      )} */}
    </div>
  );
}

function NavRow({ item, collapsed }) {
  const enabled = isNavEnabled(item);
  const Icon = item.icon;

  if (enabled) {
    const link = (
      <NavLink
        to={item.to}
        data-testid={NAV.item(item.key)}
        className={({ isActive }) =>
          cn(
            "group flex items-center gap-2.5 rounded-md text-[13px] transition-colors",
            collapsed ? "h-9 w-9 justify-center mx-auto" : "h-9 px-2.5",
            isActive
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="border border-border bg-card text-foreground">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  }

  const lockedRow = (
    <div
      data-testid={NAV.item(item.key)}
      aria-disabled="true"
      className={cn(
        "flex items-center gap-2.5 rounded-md text-[13px] text-muted-foreground/45 cursor-not-allowed select-none",
        collapsed ? "h-9 w-9 justify-center mx-auto" : "h-9 px-2.5"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-50" strokeWidth={1.75} />
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      <Lock className={cn("shrink-0 opacity-60", collapsed ? "h-3 w-3 absolute -bottom-0.5 -right-0.5" : "h-3 w-3")} />
    </div>
  );

  const tooltipLabel = collapsed ? `${item.label} — ${LOCKED_REASON}` : LOCKED_REASON;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("block w-full", collapsed && "relative inline-flex justify-center")}>
          {lockedRow}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-w-[220px] border border-border bg-popover text-foreground text-[12px] leading-snug"
      >
        {tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
