import InviteMemberForm from "@/components/team/InviteMemberForm";
import MembersTable from "@/components/team/MembersTable";
import PendingInvitations from "@/components/team/PendingInvitations";
import TeamPageSkeleton from "@/components/team/TeamPageSkeleton";
import TeamPrivileges from "@/components/team/TeamPrivileges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    return <TeamPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground text-[13px]">
        Could not load team details.
      </div>
    );
  }

  const { members, invitations, permissions, availableRoles, privilegeMatrix } = data;
  const pendingCount = invitations?.length || 0;

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// collaboration</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Team</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Invite people, manage roles, and collaborate in real-time.
          </p>
        </div>
      </div>

      <InviteMemberForm
        teamId={teamId}
        canInvite={permissions?.canCreateInvitation}
        availableRoles={availableRoles || []}
      />

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mt-5 flex h-9 w-full justify-start gap-1 rounded-none border-b border-border bg-transparent px-0">
          <TabsTrigger
            value="members"
            className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            All team
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Pending invitations
            {pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="privileges"
            className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-[hsl(var(--brand))] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Team privileges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-5 space-y-5">
          <MembersTable
            teamId={teamId}
            members={members || []}
            availableRoles={availableRoles || []}
            canUpdateMember={permissions?.canUpdateMember}
            canRemoveMember={permissions?.canRemoveMember}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-5">
          <PendingInvitations
            teamId={teamId}
            invitations={invitations || []}
            canCancel={permissions?.canCancelInvitation}
            canResend={permissions?.canCreateInvitation}
          />
        </TabsContent>

        <TabsContent value="privileges" className="mt-5">
          <TeamPrivileges privilegeMatrix={privilegeMatrix} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
