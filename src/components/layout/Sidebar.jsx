import { NavLink, useNavigate } from "react-router-dom";
import {
  Send,
  Boxes,
  ServerCog,
  History as HistoryIcon,
  Activity,
  Briefcase,
  Users,
  Workflow,
  Sparkles,
  Upload,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useLogout } from "@/hooks/use-auth";
import { NAV, AUTH } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LinkSimpleHorizontalIcon,UsersThreeIcon,CubeIcon,SwapIcon } from "@phosphor-icons/react";



const NAV_ITEMS = [
  { to: "/builder", icon: LinkSimpleHorizontalIcon, label: "APIs", key: "apis", enabled: true },
  { to: "/environments", icon: Boxes, label: "Environments", key: "environments", enabled: true },
  { to: "/mock-servers", icon: ServerCog, label: "Mock Servers", key: "mock-servers" },
  { to: "/history", icon: HistoryIcon, label: "History", key: "history", enabled: true },
  { to: "/monitoring", icon: Activity, label: "Monitoring", key: "monitoring" },
  { to: "/workspaces", icon: CubeIcon, label: "Workspaces", key: "workspaces", enabled: true },
];

const SECONDARY_TOP = [
  { to: "/team", icon: UsersThreeIcon, label: "Team", key: "team", enabled: true },
  { to: "/conduits", icon: Workflow, label: "Conduits", key: "conduits", enabled: true },
  { to: "/generators", icon: Sparkles, label: "Generators", key: "generators" },
  { to: "/import", icon: SwapIcon, label: "Import API", key: "import", enabled: true },
];

const LOCKED_REASON = "Coming soon — still being built.";

const isNavEnabled = (item) => item.enabled === true;

function SidebarTooltipContent({ children, className, ...props }) {
  return (
    <TooltipContent
      side="right"
      align="center"
      sideOffset={8}
      className={cn(
        "border border-border bg-card text-foreground py-1 px-2 rounded text-xs",
        className,
      )}
      {...props}
    >
      {children}
      <TooltipArrow className="fill-card stroke-border stroke-[1]" />
    </TooltipContent>
  );
}

export default function Sidebar() {
  const user = useAppStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map((it) => (
          <NavRow key={it.key} item={it} />
        ))}

        <div className="my-3 mx-0" />
        {SECONDARY_TOP.map((it) => (
          <NavRow key={it.key} item={it} />
        ))}
      </nav>

      <div className="shrink-0 pb-3 px-2 flex flex-col items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-9 w-9 rounded overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-[hsl(var(--brand))] transition-all grid place-items-center"
              aria-label="Account menu"
              data-testid="user-menu-trigger"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-violet-400 to-indigo-500 grid place-items-center text-white text-[11px] font-semibold">
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-56 bg-card border-border text-foreground">
            <DropdownMenuLabel className="text-muted-foreground text-[11px] uppercase tracking-wider">
              Account
            </DropdownMenuLabel>
            {user?.name && (
              <div className="px-2 pb-2">
                <div className="text-[13px] font-medium truncate">{user.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              </div>
            )}
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

function NavRow({ item }) {
  const enabled = isNavEnabled(item);
  const Icon = item.icon;

  if (enabled) {
    const className = cn(
      "group flex items-center transition-colors rounded-sm",
      "h-9 w-9 justify-center mx-auto text-muted-foreground hover:text-foreground hover:bg-accent/40",
    );

    const link = item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        data-testid={NAV.item(item.key)}
        className={className}
      >
        <Icon size={32} weight="duotone" />
      </a>
    ) : (
      <NavLink
        to={item.to}
        data-testid={NAV.item(item.key)}
        className={({ isActive }) =>
          cn(
            "group flex items-center transition-colors rounded-sm",
            "h-9 w-9 justify-center mx-auto",
            isActive
              ? "text-foreground bg-accent/60"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
          )
        }
        tabIndex={0}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      </NavLink>
    );

    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex w-full justify-center">{link}</div>
        </TooltipTrigger>
        <SidebarTooltipContent>{item.label}</SidebarTooltipContent>
      </Tooltip>
    );
  }

  const rowContent = (
    <div
      className="flex items-center rounded-md h-9 w-9 justify-center mx-auto opacity-40 cursor-not-allowed select-none"
      aria-disabled="true"
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
    </div>
  );

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="flex w-full justify-center cursor-not-allowed">{rowContent}</div>
      </TooltipTrigger>
      <SidebarTooltipContent className="max-w-[200px] leading-snug">
        <span className="font-medium">{item.label}</span>
        <span className="text-muted-foreground"> — {LOCKED_REASON}</span>
      </SidebarTooltipContent>
    </Tooltip>
  );
}
