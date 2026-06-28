import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import {
  Send,
  // FolderTree,
  Boxes,
  Briefcase,
  // LayoutGrid,
  Settings as SettingsIcon,
  Plus,
  ServerCog,
  Activity,
  History as HistoryIcon,
  Users,
  Workflow,
  Sparkles,
  Upload,
  BookOpenText,
} from "lucide-react";
import { CMD } from "@/constants/testIds";
import { toast } from "sonner";

export default function CommandPalette() {
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const workspaces = useAppStore((s) => s.workspaces);
  const setActive = useAppStore((s) => s.setActiveWorkspace);
  const collections = useAppStore(selectWorkspaceCollections);
  const createCollection = useAppStore((s) => s.createCollection);
  const createEnvironment = useAppStore((s) => s.createEnvironment);
  const navigate = useNavigate();

  const run = (fn) => {
    setOpen(false);
    setTimeout(fn, 50);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div data-testid={CMD.dialog}>
        <CommandInput
          placeholder="Type a command or search…"
          data-testid={CMD.input}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Actions">
            <CommandItem
              data-testid={CMD.item("new-request")}
              onSelect={() => run(() => { navigate("/builder"); toast.success("New request scratchpad opened"); })}
            >
              <Send /> New request <CommandShortcut>⌘ /</CommandShortcut>
            </CommandItem>
            <CommandItem
              data-testid={CMD.item("new-collection")}
              onSelect={() => run(() => {
                const c = createCollection(`Untitled collection ${Math.floor(Math.random() * 999)}`);
                toast.success(`Collection "${c.name}" created`);
                navigate("/builder");
              })}
            >
              <Plus /> New collection
            </CommandItem>
            <CommandItem
              data-testid={CMD.item("new-environment")}
              onSelect={() => run(() => {
                const e = createEnvironment(`New Environment ${Math.floor(Math.random() * 99)}`);
                toast.success(`Environment "${e.name}" created`);
                navigate("/environments");
              })}
            >
              <Boxes /> New environment
            </CommandItem>
            <CommandItem
              data-testid={CMD.item("open-settings")}
              onSelect={() => run(() => navigate("/settings"))}
            >
              <SettingsIcon /> Open settings
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigate">
            {[
              // { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
              // { to: "/collections", label: "Collections", icon: FolderTree },
              { to: "/builder", label: "API Builder", icon: Send },
              { to: "/environments", label: "Environments", icon: Boxes },
              { to: "/mock-servers", label: "Mock Servers", icon: ServerCog },
              { to: "/documentation", label: "Documentation", icon: BookOpenText },
              { to: "/history", label: "History", icon: HistoryIcon },
              { to: "/monitoring", label: "Monitoring", icon: Activity },
              { to: "/workspaces", label: "Workspaces", icon: Briefcase },
              { to: "/team", label: "Team", icon: Users },
              { to: "/conduits", label: "Conduits", icon: Workflow },
              { to: "/generators", label: "Generators", icon: Sparkles },
              { to: "/import", label: "Import API", icon: Upload },
            ].map((n) => {
              const Icon = n.icon;
              return (
                <CommandItem
                  key={n.to}
                  data-testid={CMD.item(n.to.replace("/", ""))}
                  onSelect={() => run(() => navigate(n.to))}
                >
                  <Icon /> {n.label}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Switch workspace">
            {workspaces.map((w) => (
              <CommandItem
                key={w.id}
                data-testid={CMD.item(`ws-${w.id}`)}
                onSelect={() => run(() => { setActive(w.id); toast.success(`Switched to ${w.name}`); })}
              >
                <Briefcase /> {w.name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Open request">
            {collections.flatMap((c) =>
              c.requests.slice(0, 4).map((r) => (
                <CommandItem
                  key={r.id}
                  data-testid={CMD.item(`req-${r.id}`)}
                  onSelect={() => run(() => navigate(`/builder/${r.id}`))}
                >
                  <Send /> {c.name} — {r.name}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
