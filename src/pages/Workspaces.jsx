import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import WorkspaceCard from "@/components/workspaces/WorkspaceCard";
import { useAppStore } from "@/store/useAppStore";
import {
  getErrorMessage,
  useCreateTeam,
  useDeleteTeam,
  useDuplicateTeam,
  useRenameTeam,
  useSwitchTeam,
} from "@/hooks/use-teams";

export default function Workspaces() {
  const workspaces = useAppStore((s) => s.workspaces);
  const active = useAppStore((s) => s.activeWorkspaceId);
  const switchTeam = useSwitchTeam();
  const createTeam = useCreateTeam();
  const renameTeam = useRenameTeam();
  const deleteTeam = useDeleteTeam();
  const duplicateTeam = useDuplicateTeam();

  const activatingId = switchTeam.isPending ? String(switchTeam.variables) : null;
  const renamingId = renameTeam.isPending ? String(renameTeam.variables?.teamId) : null;
  const deletingId = deleteTeam.isPending ? String(deleteTeam.variables?.teamId) : null;
  const duplicatingId = duplicateTeam.isPending ? String(duplicateTeam.variables?.teamId) : null;

  const handleCreate = () => {
    const name = `Workspace ${workspaces.length + 1}`;
    createTeam.mutate(
      { name },
      {
        onSuccess: () => toast.success(`Created ${name}`),
        onError: (err) => toast.error(getErrorMessage(err, "Could not create workspace.")),
      },
    );
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// workspaces</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Workspaces</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Isolated environments, collections, and team members.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={createTeam.isPending}
          className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
          data-testid="workspaces-new"
        >
          {createTeam.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {createTeam.isPending ? "Creating…" : "New workspace"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workspaces.map((w) => (
          <WorkspaceCard
            key={w.id}
            ws={w}
            isActive={w.id === active}
            isActivating={activatingId === w.id}
            isRenaming={renamingId === w.id}
            isDeleting={deletingId === w.id}
            isDuplicating={duplicatingId === w.id}
            onActivate={() => {
              switchTeam.mutate(w.id, {
                onSuccess: () => toast.success(`Switched to ${w.name}`),
                onError: (err) => toast.error(getErrorMessage(err, "Could not switch workspace.")),
              });
            }}
            onRename={(name) => {
              if (name === w.name) return;
              renameTeam.mutate(
                { teamId: w.id, name },
                {
                  onSuccess: () => toast.success("Workspace renamed"),
                  onError: (err) => toast.error(getErrorMessage(err, "Could not rename workspace.")),
                },
              );
            }}
            onDuplicate={() => {
              duplicateTeam.mutate(
                { teamId: w.id },
                {
                  onSuccess: () => toast.success(`Duplicated ${w.name}`),
                  onError: (err) => toast.error(getErrorMessage(err, "Could not duplicate workspace.")),
                },
              );
            }}
            onDelete={(name) => {
              deleteTeam.mutate(
                { teamId: w.id, name },
                {
                  onSuccess: () => toast.success(`Deleted ${w.name}`),
                  onError: (err) => toast.error(getErrorMessage(err, "Could not delete workspace.")),
                },
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
