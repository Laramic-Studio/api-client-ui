import { useActiveTeamId, useTeamDetail } from "@/hooks/use-teams";

/** Keeps team permissions cached for the active workspace across all routes. */
export default function TeamPermissionsBootstrap() {
  const teamId = useActiveTeamId();
  useTeamDetail(teamId);
  return null;
}
