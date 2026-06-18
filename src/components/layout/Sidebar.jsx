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
  Search,
  PanelsTopLeft,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { NAV } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo } from "react";
import { StackedLogo } from "./stack-logo";
import { DOCS_URL } from "@/lib/config";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutGrid, label: "Dashboard", key: "dashboard" },
  { to: "/collections", icon: FolderTree, label: "Collections", key: "collections", enabled: true },
  { to: "/builder", icon: Send, label: "APIs", key: "apis", enabled: true },
  { to: "/environments", icon: Boxes, label: "Environments", key: "environments", enabled: true },
  { to: "/mock-servers", icon: ServerCog, label: "Mock Servers", key: "mock-servers" },
  { href: DOCS_URL, icon: BookOpenText, label: "Documentation", key: "documentation", enabled: true, external: true },
  { to: "/history", icon: HistoryIcon, label: "History", key: "history" },
  { to: "/monitoring", icon: Activity, label: "Monitoring", key: "monitoring" },
  { to: "/workspaces", icon: Briefcase, label: "Workspaces", key: "workspaces", enabled: true },
];

// Settings is pulled out so it can be pinned to the bottom in collapsed mode
const SECONDARY_TOP = [
  { to: "/team", icon: Users, label: "Team", key: "team", enabled: true },
  { to: "/conduits", icon: Workflow, label: "Conduits", key: "conduits", enabled: true },
  { to: "/generators", icon: Sparkles, label: "Generators", key: "generators" },
  { to: "/import", icon: Upload, label: "Import API", key: "import" },
];

const SETTINGS_ITEM = { to: "/settings", icon: SettingsIcon, label: "Settings", key: "settings", enabled: true };

const SECONDARY = [...SECONDARY_TOP, SETTINGS_ITEM];

const LOCKED_REASON = "Coming soon — still being built.";

const isNavEnabled = (item) => item.enabled === true;

export default function Sidebar({ collapsed }) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const companyLogo = useAppStore((s) => s.user?.company?.logo);
  const companyName = useAppStore((s) => s.user?.company?.name);
  const userAvatar = useAppStore((s) => s.user?.avatar);
  const userName = useAppStore((s) => s.user?.name);
  const [q, setQ] = useState("");

  const all = useMemo(() => [...NAV_ITEMS, ...SECONDARY], []);
  const filtered = q ? all.filter((n) => n.label.toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Logo + collapse */}
      <div
        className={cn(
          "h-14 flex items-center border-b border-border shrink-0",
          collapsed ? "px-2 justify-center" : "px-3 gap-1"
        )}
      >
        <button
          type="button"
          className="flex items-center gap-2 group cursor-default"
          data-testid="brand-logo"
          title="Noidr Web"
        >
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#6366F1] to-[#4F46E5] grid place-items-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName || "Company"} className="h-full w-full object-cover" />
            ) : (
              <StackedLogo className="h-4 w-4 text-white" />
            )}
          </div>
          {!collapsed && (
            <div className="text-[15px] font-medium tracking-tight truncate max-w-[140px]">
              {companyName || (
                <>
                  <span>noidr</span>
                  <span className="text-[hsl(var(--brand))]">.</span>
                  <span>web</span>
                </>
              )}
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

      {/* Search — expanded only */}
      {!collapsed && (
        <div className="px-3 pt-3 shrink-0">
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

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Collapsed: search icon at top of rail */}
        {collapsed && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 mx-auto flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors mb-1"
                aria-label="Expand sidebar to search"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={6} className="border border-border bg-card text-foreground py-1 px-2 rounded text-xs">
              Search
            </TooltipContent>
          </Tooltip>
        )}

        {(filtered ?? NAV_ITEMS).map((it) => (
          <NavRow key={it.key} item={it} collapsed={collapsed} />
        ))}

        {!filtered && (
          <>
            <div className={cn("border-t border-border", collapsed ? "my-2 mx-1" : "my-3 mx-0")} />
            {!collapsed && (
              <div className="mb-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Tools
              </div>
            )}
            {/* In collapsed mode, settings is pinned to bottom — skip it here */}
            {(collapsed ? SECONDARY_TOP : SECONDARY).map((it) => (
              <NavRow key={it.key} item={it} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom slot — collapsed only: settings + avatar */}
      {collapsed && !filtered && (
        <div className="shrink-0 pb-3 px-2 flex flex-col items-center gap-1 border-t border-border pt-2">
          <NavRow item={SETTINGS_ITEM} collapsed={true} />
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="mt-1 h-7 w-7 rounded-full overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-[hsl(var(--brand))] transition-all"
                aria-label="Expand sidebar"
                data-testid={NAV.collapseToggle}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt={userName || "User"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-violet-400 to-indigo-500 grid place-items-center text-white text-[10px] font-semibold">
                    {userName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" sideOffset={6} className="border border-border bg-card text-foreground py-1 px-2 rounded text-xs">
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

function NavRow({ item, collapsed }) {
  const enabled = isNavEnabled(item);
  const Icon = item.icon;

  if (enabled) {
    const className = cn(
      "group flex items-center transition-colors rounded-md",
      collapsed
        ? "h-9 w-9 justify-center mx-auto text-muted-foreground hover:text-foreground hover:bg-accent/40"
        : "h-9 px-2.5 gap-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent pl-[calc(0.625rem-2px)]",
    );

    const link = item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={NAV.item(item.key)}
        className={className}
      >
        <Icon className={cn("shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </a>
    ) : (
      <NavLink
        to={item.to}
        data-testid={NAV.item(item.key)}
        className={({ isActive }) =>
          cn(
            "group flex items-center transition-colors rounded-md",
            collapsed
              ? cn(
                  "h-9 w-9 justify-center mx-auto",
                  isActive
                    ? "text-foreground bg-accent/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )
              : cn(
                  "h-9 px-2.5 gap-2.5 text-[13px]",
                  isActive
                    ? "bg-accent text-foreground border-l-2 border-[hsl(var(--brand))] pl-[calc(0.625rem-2px)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50 border-l-2 border-transparent pl-[calc(0.625rem-2px)]"
                )
          )
        }
        tabIndex={0}
      >
        <Icon className={cn("shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div className="flex w-full justify-center">{link}</div>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" sideOffset={6} className="border border-border bg-card text-foreground py-1 px-2 rounded text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  }

  // Disabled / locked item
  const rowContent = (
    <div
      className={cn(
        "flex items-center rounded-md h-9 opacity-40 cursor-not-allowed select-none",
        collapsed
          ? "w-9 justify-center mx-auto"
          : "gap-2.5 text-[13px] px-2.5 border-l-2 border-transparent pl-[calc(0.625rem-2px)]"
      )}
      aria-disabled="true"
    >
      <Icon className={cn("shrink-0", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} strokeWidth={1.75} />
      {!collapsed && (
        <>
          <span className="truncate flex-1">{item.label}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground leading-none">
            Soon
          </span>
        </>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex w-full justify-center cursor-not-allowed">{rowContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right" align="center" sideOffset={6} className="max-w-[200px] border border-border bg-popover text-foreground text-xs leading-snug py-1 px-2 rounded">
          <span className="font-medium">{item.label}</span>
          <span className="text-muted-foreground"> — {LOCKED_REASON}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return rowContent;
}