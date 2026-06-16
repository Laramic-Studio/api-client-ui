// One-click env swap for the active request. Persists per-collection.
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceEnvironments } from "@/lib/store/selectors";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Box } from "lucide-react";

export default function EnvPicker({ collectionId }) {
  const envs = useAppStore(selectWorkspaceEnvironments);
  const setEnv = useAppStore((s) => s.setActiveEnvForCollection);
  const setActive = useAppStore((s) => s.setActiveEnvironment);
  const map = useAppStore((s) => s.activeEnvByCollection);

  // Filter to workspace-wide + this collection's scoped envs
  const visible = envs.filter((e) => !e.collectionId || e.collectionId === collectionId);
  const current = (collectionId && map[collectionId]) || visible.find((e) => e.active)?.id || visible[0]?.id;

  const onChange = (id) => {
    if (collectionId) setEnv(collectionId, id);
    else setActive(id);
  };

  return (
    <Select value={current || ""} onValueChange={onChange}>
      <SelectTrigger
        className="h-9 w-40 bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[12px]"
        data-testid="builder-env-picker"
        title="Active environment for this request"
      >
        <Box className="h-3 w-3 text-[hsl(var(--brand))]" />
        <SelectValue placeholder="No env" />
      </SelectTrigger>
      <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
        {visible.map((e) => (
          <SelectItem key={e.id} value={e.id} className="text-[12.5px]">
            {e.name}
            {e.collectionId && <span className="ml-2 text-[10px] text-muted-foreground font-mono">scoped</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
