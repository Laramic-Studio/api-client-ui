// Pluggable API client. Default impl is a local Zustand-backed mock.
// To wire to a real backend, swap out this module's `client` export
// with one that calls fetch/axios. Stores and pages MUST go through
// these methods so the rest of the app is backend-agnostic.
//
// CONTRACT: every method returns a Promise.
import { useAppStore } from "@/store/useAppStore";
import { runMockRequest, runTests as runTestsImpl } from "@/lib/mockEngine";

const get = () => useAppStore.getState();

// Helper so the adapter feels async even for sync state ops
const async_ = (fn) => Promise.resolve().then(fn);

export const client = {
  // ----- Auth -----
  async login({ email, name }) { return async_(() => get().login({ email, name })); },
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

  // ----- History / mock servers / team / notifications (read-through) -----
  async listHistory() { return async_(() => get().history); },
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
