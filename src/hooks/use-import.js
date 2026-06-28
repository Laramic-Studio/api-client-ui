import { useMutation } from "@tanstack/react-query";
import { persistImportCollection } from "@/lib/import/persist-import";
import { useActiveTeamId } from "@/hooks/use-collections";

export function useImportCollection() {
  const teamId = useActiveTeamId();

  return useMutation({
    mutationFn: (collection) => persistImportCollection(teamId, collection),
  });
}
