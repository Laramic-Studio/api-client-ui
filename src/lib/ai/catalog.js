import { getClient } from "@/lib/api/client";
import { conduitKeys } from "@/lib/api/query-keys";
import { summarizeConduitsForAi } from "@/lib/ai/snapshot";

export function findConduitMatch(conduits, { conduit_id: conduitId, name }) {
  if (!conduits?.length) return null;
  if (conduitId) return conduits.find((c) => c.id === conduitId) || null;
  if (name) {
    const q = String(name).toLowerCase().trim();
    return conduits.find((c) => c.name.toLowerCase() === q)
      || conduits.find((c) => c.name.toLowerCase().includes(q))
      || null;
  }
  return null;
}

export async function loadAiCatalogExtras(queryClient, teamId) {
  if (!teamId) return { conduits: [] };

  try {
    const conduits = await queryClient.fetchQuery({
      queryKey: conduitKeys.list(teamId),
      queryFn: () => getClient().listConduits(),
      staleTime: 30_000,
    });
    return { conduits: summarizeConduitsForAi(conduits || []) };
  } catch {
    const cached = queryClient.getQueryData(conduitKeys.list(teamId));
    return { conduits: summarizeConduitsForAi(cached || []) };
  }
}

export function readCachedConduits(queryClient, teamId) {
  if (!teamId) return [];
  return summarizeConduitsForAi(queryClient.getQueryData(conduitKeys.list(teamId)) || []);
}
