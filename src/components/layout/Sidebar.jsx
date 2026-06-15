import { NavLink, useNavigate } from "react-router-dom";
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
  { to: "/workspaces", icon: Briefcase, label: "Workspaces", key: "workspaces" },
];

const SECONDARY = [
  { to: "/team", icon: Users, label: "Team", key: "team" },
  { to: "/conduits", icon: Workflow, label: "Conduits", key: "conduits" },
  { to: "/generators", icon: Sparkles, label: "Generators", key: "generators" },
  { to: "/import", icon: Upload, label: "Import API", key: "import" },
  { to: "/settings", icon: SettingsIcon, label: "Settings", key: "settings" },
];

export default function Sidebar({ collapsed }) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const workspaces = useAppStore((s) => s.workspaces);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);
  const setActive = useAppStore((s) => s.setActiveWorkspace);
  const companyLogo = useAppStore((s) => s.user?.company?.logo);
  const companyName = useAppStore((s) => s.user?.company?.name);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);

  const all = useMemo(() => [...NAV_ITEMS, ...SECONDARY], []);
  const filtered = q ? all.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Logo + collapse */}
      <div className={cn("h-14 flex items-center border-b border-border", collapsed ? "px-2 justify-center" : "px-3 gap-1")}>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 group"
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

      {/* Workspace switcher */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setCommandOpen(true)}
            data-testid={NAV.workspaceSwitcher}
            className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md bg-accent/50 hover:bg-accent border border-border transition-colors"
          >
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Workspace</div>
              <div className="text-[13px] font-medium truncate mt-0.5">{activeWs?.name || "Select workspace"}</div>
            </div>
            <kbd className="kbd">⌘K</kbd>
          </button>
        </div>
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
      {!collapsed && (
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
      )}
    </div>
  );
}

function NavRow({ item, collapsed }) {
  const Icon = item.icon;
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
      <Icon className="h-4 w-4" strokeWidth={1.75} />
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
