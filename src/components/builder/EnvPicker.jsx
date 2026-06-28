// Environment selector for the API builder — workspace + collection-scoped envs.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceEnvironments } from "@/lib/store/selectors";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { Box, Loader2, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  useActivateEnvironment,
  useCreateEnvironment,
  useEnvironments,
  useSetEnvironmentPreference,
} from "@/hooks/use-environments";

const CREATE_VALUE = "__create_env__";

export default function EnvPicker({ collectionId, compact = false, tabBar = false, className }) {
  const envs = useAppStore(selectWorkspaceEnvironments);
  const setEnv = useAppStore((s) => s.setActiveEnvForCollection);
  const setActive = useAppStore((s) => s.setActiveEnvironment);
  const map = useAppStore((s) => s.activeEnvByCollection);

  const { isLoading } = useEnvironments();
  const activate = useActivateEnvironment();
  const setPreference = useSetEnvironmentPreference();
  const createEnv = useCreateEnvironment();

  const visible = useMemo(
    () => envs.filter((e) => !e.collectionId || e.collectionId === collectionId),
    [envs, collectionId],
  );

  const workspaceEnvs = useMemo(
    () => visible.filter((e) => !e.collectionId),
    [visible],
  );

  const collectionEnvs = useMemo(
    () => visible.filter((e) => e.collectionId),
    [visible],
  );

  const current = (collectionId && map[collectionId])
    || visible.find((e) => e.active)?.id
    || visible[0]?.id
    || "";

  const isPending = activate.isPending || setPreference.isPending || createEnv.isPending;
  const selected = visible.find((e) => e.id === current);

  // One collection-scoped env per collection; one workspace env when no collection context.
  const canCreateEnv = collectionId
    ? collectionEnvs.length === 0
    : workspaceEnvs.length === 0;

  const selectEnv = (id) => {
    if (collectionId) {
      setEnv(collectionId, id);
      setPreference.mutate({ collectionId, environmentId: id });
      return;
    }
    setActive(id);
    activate.mutate(id);
  };

  const handleChange = (value) => {
    if (value === CREATE_VALUE) {
      createEnv.mutate(
        {
          name: collectionId ? "Collection Environment" : "New Environment",
          collection_id: collectionId || null,
        },
        {
          onSuccess: (data) => {
            const id = data.environment.id;
            selectEnv(id);
            toast.success(`Created ${data.environment.name}`);
          },
          onError: (err) => toast.error(getErrorMessage(err, "Could not create environment.")),
        },
      );
      return;
    }
    selectEnv(value);
  };

  return (
    <Select
      value={current || undefined}
      onValueChange={handleChange}
      disabled={isPending}
      className={tabBar ? "h-full" : undefined}
    >
      <SelectTrigger
        className={cn(
          tabBar
            ? [
                "h-full min-h-9 rounded-none border-0 border-r border-[hsl(var(--border))]",
                "bg-[hsl(var(--card))] shadow-none px-3 gap-2",
                "text-[12.5px] font-normal text-muted-foreground",
                "hover:text-foreground hover:bg-accent/50",
                "focus:ring-0 focus:ring-offset-0",
                "w-auto max-w-[12rem] min-w-[7rem]",
                "[&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50",
              ]
            : [
                "gap-2 border-[hsl(var(--border))] bg-[hsl(var(--input))] text-[12px] font-medium shadow-none",
                "w-[10.5rem]",
                compact ? "h-7 px-2" : "h-9 px-2.5",
              ],
          className,
        )}
        data-testid="builder-env-picker"
        title={selected ? `Environment: ${selected.name}` : "Select environment"}
      >
        {isPending || isLoading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[hsl(var(--brand))]" />
        ) : (
          <Box className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--brand))]" />
        )}
        <SelectValue placeholder={isLoading ? "Loading…" : "Environment"} />
      </SelectTrigger>

      <SelectContent
        className="bg-[hsl(var(--popover))] border-[hsl(var(--border))] min-w-[12rem]"
        align="end"
      >
        {visible.length === 0 && !isLoading && (
          <div className="px-2 py-2.5 text-[12px] text-muted-foreground text-center">
            No environments yet
          </div>
        )}

        {workspaceEnvs.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wider font-geom text-muted-foreground">
              Workspace
            </SelectLabel>
            {workspaceEnvs.map((env) => (
              <SelectItem key={env.id} value={env.id} className="text-[12.5px]">
                {env.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {collectionEnvs.length > 0 && (
          <SelectGroup>
            {workspaceEnvs.length > 0 && <SelectSeparator className="bg-[hsl(var(--border))]" />}
            <SelectLabel className="text-[10px] uppercase tracking-wider font-geom text-muted-foreground">
              Collection
            </SelectLabel>
            {collectionEnvs.map((env) => (
              <SelectItem key={env.id} value={env.id} className="text-[12.5px]">
                {env.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {canCreateEnv && (
          <>
            <SelectSeparator className="bg-[hsl(var(--border))]" />
            <SelectItem value={CREATE_VALUE} className="text-[12.5px] text-[hsl(var(--brand))]">
              <span className="inline-flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                {collectionId ? "Create collection environment" : "Create environment"}
              </span>
            </SelectItem>
          </>
        )}

        <SelectSeparator className="bg-[hsl(var(--border))]" />

        <div className="p-1">
          <Link
            to="/environments"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-[12px] text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage environments
          </Link>
        </div>
      </SelectContent>
    </Select>
  );
}
