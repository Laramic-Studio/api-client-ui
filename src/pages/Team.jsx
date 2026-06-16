import { ShieldCheck } from "lucide-react";
import InviteMemberForm from "@/components/team/InviteMemberForm";
import MembersTable from "@/components/team/MembersTable";
import PendingInvitations from "@/components/team/PendingInvitations";
import { useActiveTeamId, useTeamDetail } from "@/hooks/use-teams";

export default function Team() {
  const teamId = useActiveTeamId();
  const { data, isLoading, isError } = useTeamDetail(teamId);

  if (!teamId) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        Select a workspace to manage its team.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        Loading team…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        Could not load team details.
      </div>
    );
  }

  const { members, invitations, permissions, availableRoles } = data;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// collaboration</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Team</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Invite people, manage roles, and collaborate in {data.team?.name || "this workspace"}.
          </p>
        </div>
      </div>

      <InviteMemberForm
        teamId={teamId}
        canInvite={permissions?.canCreateInvitation}
        availableRoles={availableRoles || []}
      />

      <MembersTable
        teamId={teamId}
        members={members || []}
        availableRoles={availableRoles || []}
        canUpdateMember={permissions?.canUpdateMember}
        canRemoveMember={permissions?.canRemoveMember}
      />

      <PendingInvitations
        teamId={teamId}
        invitations={invitations || []}
        canCancel={permissions?.canCancelInvitation}
      />

      <div className="mt-5 rounded-md border border-border bg-card p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand))] mt-0.5" />
        <div className="text-[12.5px] text-foreground/85">
          <div className="font-medium">Role permissions</div>
          <div className="text-muted-foreground mt-1">
            <span className="font-mono text-foreground/85">Owner</span> — full control.{" "}
            <span className="font-mono text-foreground/85">Admin</span> — manage workspace & invitations.{" "}
            <span className="font-mono text-foreground/85">Member</span> — collaborate on collections.
          </div>
        </div>
      </div>
    </div>
  );
}
