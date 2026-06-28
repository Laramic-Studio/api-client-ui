import { useCallback } from "react";
import { toast } from "sonner";
import {
  READ_ONLY_TOAST_DESCRIPTION,
  READ_ONLY_TOAST_TITLE,
} from "@/lib/permissions";
import { useActiveTeamId, useTeamDetail } from "@/hooks/use-teams";

const defaultPermissions = {
  canUpdateTeam: false,
  canDeleteTeam: false,
  canAddMember: false,
  canUpdateMember: false,
  canRemoveMember: false,
  canCreateInvitation: false,
  canCancelInvitation: false,
  canViewWorkspace: false,
  canWriteWorkspace: false,
};

export function useTeamPermissions() {
  const teamId = useActiveTeamId();
  const { data, isLoading } = useTeamDetail(teamId);
  const permissions = data?.permissions ?? defaultPermissions;

  return {
    ...permissions,
    role: data?.team?.role ?? null,
    roleLabel: data?.team?.roleLabel ?? null,
    isLoading: Boolean(teamId) && isLoading,
    isReadOnly: Boolean(teamId) && !isLoading && !permissions.canWriteWorkspace,
  };
}

export function useWorkspaceWriteAccess() {
  const perms = useTeamPermissions();

  const notifyReadOnly = useCallback(() => {
    toast.error(READ_ONLY_TOAST_TITLE, {
      description: READ_ONLY_TOAST_DESCRIPTION,
    });
  }, []);

  const guardWrite = useCallback(
    (action) => {
      if (perms.canWriteWorkspace) {
        return action();
      }
      notifyReadOnly();
      return undefined;
    },
    [notifyReadOnly, perms.canWriteWorkspace],
  );

  return {
    ...perms,
    notifyReadOnly,
    guardWrite,
  };
}
