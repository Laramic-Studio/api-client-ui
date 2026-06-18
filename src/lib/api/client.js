// Pluggable API client. Default impl is a local Zustand-backed mock.
// To wire to a real backend, swap out this module's `client` export
// with one that calls axios via fetchClient. Stores and pages MUST go through
// these methods so the rest of the app is backend-agnostic.
//
// CONTRACT: every method returns a Promise.
import { useAppStore } from "@/store/useAppStore";
import { runMockRequest, runTests as runTestsImpl } from "@/lib/mockEngine";

const get = () => useAppStore.getState();

const STARTER_CONDUIT = {
  id: "c_starter",
  name: "Auth → Profile → Orders",
  steps: [
    { id: "node1", name: "Login", method: "POST", url: "[[BASE_URL]]/auth/login", extract: "token", headers: [], body: { type: "none", content: "" }, auth: { type: "none" } },
    { id: "node2", name: "Fetch profile", method: "GET", url: "[[BASE_URL]]/users/me", extract: "user.id", headers: [], body: { type: "none", content: "" }, auth: { type: "none" } },
    { id: "node3", name: "List orders", method: "GET", url: "[[BASE_URL]]/orders?user={user.id}", extract: "", headers: [], body: { type: "none", content: "" }, auth: { type: "none" } },
  ],
};

const mockConduitsByTeam = new Map();

function getMockConduits(teamId) {
  if (!teamId) return [];
  if (!mockConduitsByTeam.has(teamId)) {
    mockConduitsByTeam.set(teamId, [{ ...STARTER_CONDUIT, steps: STARTER_CONDUIT.steps.map((s) => ({ ...s })) }]);
  }
  return mockConduitsByTeam.get(teamId);
}

function setMockConduits(teamId, list) {
  mockConduitsByTeam.set(teamId, list);
}

// Helper so the adapter feels async even for sync state ops
const async_ = (fn) => Promise.resolve().then(fn);

export const client = {
  // ----- Auth -----
  async register({ name, email, password, password_confirmation, remember }) {
    return async_(() => get().login({ email, name, provider: "password" }));
  },

  async login({ email, name, password, remember }) { return async_(() => get().login({ email, name })); },
  async logout() { return async_(() => get().logout()); },
  async me() { return async_(() => get().user); },

  // ----- Workspaces -----
  async listWorkspaces() { return async_(() => get().workspaces); },
  async createWorkspace(name) { return async_(() => get().createWorkspace(name)); },
  async renameWorkspace(id, name) { return async_(() => get().renameWorkspace(id, name)); },
  async duplicateWorkspace(id) { return async_(() => get().duplicateWorkspace(id)); },
  async deleteWorkspace(id) { return async_(() => get().deleteWorkspace(id)); },

  // ----- Collections -----
  async listCollections() { return async_(() => get().getCollections()); },
  async createCollection(name) { return async_(() => get().createCollection(name)); },
  async updateCollection(id, patch) { return async_(() => get().updateCollection(id, patch)); },
  async deleteCollection(id) { return async_(() => get().deleteCollection(id)); },
  async duplicateCollection(id) { return async_(() => get().duplicateCollection(id)); },

  // ----- Folders -----
  async addFolder(collectionId, payload) { return async_(() => get().addFolder(collectionId, payload)); },
  async renameFolder(collectionId, folderId, name) { return async_(() => get().renameFolder(collectionId, folderId, name)); },
  async deleteFolder(collectionId, folderId) { return async_(() => get().deleteFolder(collectionId, folderId)); },

  // ----- Requests -----
  async addRequest(collectionId, payload) { return async_(() => get().addRequest(collectionId, payload)); },
  async updateRequest(collectionId, requestId, patch) { return async_(() => get().updateRequest(collectionId, requestId, patch)); },
  async deleteRequest(collectionId, requestId) { return async_(() => get().deleteRequest(collectionId, requestId)); },
  async moveRequest(collectionId, requestId, opts) { return async_(() => get().moveRequest(collectionId, requestId, opts)); },
  async reorderRequest(collectionId, fromId, toId) { return async_(() => get().reorderRequest(collectionId, fromId, toId)); },

  // ----- Examples & docs (request-scoped) -----
  async addExample(collectionId, requestId, example) { return async_(() => get().addExample(collectionId, requestId, example)); },
  async deleteExample(collectionId, requestId, exampleId) { return async_(() => get().deleteExample(collectionId, requestId, exampleId)); },

  // ----- Environments -----
  async listEnvironments(opts) { return async_(() => get().getEnvironments(opts)); },
  async createEnvironment(payload) { return async_(() => get().createEnvironment(payload)); },
  async updateEnvironment(id, patch) { return async_(() => get().updateEnvironment(id, patch)); },
  async duplicateEnvironment(id) { return async_(() => get().duplicateEnvironment(id)); },
  async deleteEnvironment(id) { return async_(() => get().deleteEnvironment(id)); },
  async setActiveEnvironment(id) { return async_(() => get().setActiveEnvironment(id)); },

  // ----- Request execution -----
  async send({ method, url, headers, body, env, mode = "mock" }) {
    return runMockRequest({ method, url, headers, body, env, mode });
  },
  runTests(script, response) {
    return runTestsImpl(script, response);
  },

  // ----- Conduits -----
  async listConduits() {
    return async_(() => getMockConduits(get().activeWorkspaceId));
  },
  async createConduit(payload) {
    return async_(() => {
      const wsId = get().activeWorkspaceId;
      const conduit = {
        id: `c_${Date.now()}`,
        name: payload?.name || "Untitled conduit",
        visibility: payload?.visibility || "private",
        sharedWith: payload?.sharedWith || [],
        canEdit: true,
        layout: payload?.layout || { edges: [] },
        steps: (payload?.steps || []).map((s, i) => ({
          id: s.id || `n_${Date.now()}_${i}`,
          ...s,
        })),
      };
      const list = [...getMockConduits(wsId), conduit];
      setMockConduits(wsId, list);
      return conduit;
    });
  },
  async updateConduit(id, patch) {
    return async_(() => {
      const wsId = get().activeWorkspaceId;
      const list = getMockConduits(wsId).map((c) =>
        c.id === id ? { ...c, ...patch, steps: patch.steps ?? c.steps } : c,
      );
      setMockConduits(wsId, list);
      return list.find((c) => c.id === id);
    });
  },
  async deleteConduit(id) {
    return async_(() => {
      const wsId = get().activeWorkspaceId;
      setMockConduits(wsId, getMockConduits(wsId).filter((c) => c.id !== id));
    });
  },

  async listConduitRuns() {
    return async_(() => []);
  },

  async storeConduitRun(_conduitId, payload) {
    return async_(() => ({ id: `run_${Date.now()}`, ...payload }));
  },

  // ----- History (mock fallback when fetchClient not used) -----
  async listHistory() { return async_(() => get().history); },
  async addHistory(entry) {
    return async_(() => {
      const item = { id: nanoUid("hist"), timestamp: Date.now(), userId: get().user?.id, ...entry };
      get().setHistory([item, ...get().history].slice(0, 500));
      return item;
    });
  },
  async deleteHistory(id) {
    return async_(() => get().setHistory(get().history.filter((h) => h.id !== id)));
  },
  async clearHistory() { return async_(() => get().setHistory([])); },
  async toggleHistoryFavorite(id) {
    return async_(() => get().setHistory(
      get().history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h)),
    ));
  },
  async listMockServers() { return async_(() => get().mockServers); },
  async listTeam() { return async_(() => get().team); },
  async listNotifications() { return async_(() => get().notifications); },
};

// Convenience: subscribers can swap the client implementation at boot.
// Example to replace with a real backend:
//
//   import { setClient } from "@/lib/api/client";
//   import { fetchClient } from "@/lib/api/fetch-client";
//   setClient(fetchClient);
//
let activeClient = client;
export const setClient = (c) => { activeClient = c; };
export const getClient = () => activeClient;

export { api, ApiError, createAbortController, isCancelledError } from "@/lib/api/http";
