import { EMPTY_ARRAY } from "@/lib/store/empty";

export const selectWorkspaceCollections = (s) =>
  s.collectionsMap[s.activeWorkspaceId] ?? EMPTY_ARRAY;

export const selectWorkspaceEnvironments = (s) =>
  s.environmentsMap[s.activeWorkspaceId] ?? EMPTY_ARRAY;
