export function mapApiEnvironment(env, workspaceId) {
  return {
    id: env.id,
    workspaceId: String(workspaceId),
    collectionId: env.collectionId || null,
    name: env.name,
    active: Boolean(env.active),
    variables: (env.variables || []).map((v) => ({
      id: v.id,
      key: v.key,
      value: v.value ?? "",
      enabled: v.enabled !== false,
      secret: Boolean(v.secret),
    })),
  };
}

export function mapPreferencesToStore(preferences = {}) {
  const activeEnvByCollection = {};

  for (const [key, environmentId] of Object.entries(preferences)) {
    if (key === "__workspace__") continue;
    activeEnvByCollection[key] = environmentId;
  }

  return activeEnvByCollection;
}

export function mapEnvironmentToApi(patch) {
  const payload = {};

  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.collectionId !== undefined) payload.collection_id = patch.collectionId;
  if (patch.variables !== undefined) {
    payload.variables = patch.variables.map((v) => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled !== false,
      secret: Boolean(v.secret),
    }));
  }

  return payload;
}
