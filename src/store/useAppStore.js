// Central Zustand store: auth, workspaces, collections, environments,
// history, mock servers, team, notifications, builder UI state.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { buildInitialState } from "@/lib/mockData";
import { nanoUid } from "@/lib/generators";
import { EMPTY_ARRAY } from "@/lib/store/empty";

const ensureSeed = (state) => {
  if (state.seeded) return state;
  const { user: _ignoredUser, history: _seedHistory, ...seedData } = buildInitialState();
  return {
    ...state,
    ...seedData,
    history: [],
    seeded: true,
  };
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      seeded: false,

      // ===== Auth =====
      user: null,
      currentTeam: null,
      authBootstrapped: false,
      login: ({ email, name, provider, accountType, company, avatar }) => {
        const u = {
          id: nanoUid("u"),
          email,
          name: name || email.split("@")[0],
          avatar: avatar || null,
          provider: provider || "password",
          accountType: accountType || null,
          company: company || null,
          onboarded: !!accountType,
          createdAt: Date.now(),
        };
        set({ user: u });
        return u;
      },
      setAuthSession: ({ user, currentTeam, workspaces, activeWorkspaceId, collectionsMap, environmentsMap }) => set({
        user,
        currentTeam: currentTeam || null,
        workspaces: workspaces || [],
        activeWorkspaceId: activeWorkspaceId || null,
        ...(collectionsMap ? { collectionsMap } : {}),
        ...(environmentsMap ? { environmentsMap } : {}),
      }),
      clearAuthSession: () => set({ user: null, currentTeam: null, history: [] }),
      finishAuthBootstrap: () => set({ authBootstrapped: true }),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),

      onboardingDraft: {},
      setOnboardingDraft: (patch) => set((s) => ({
        onboardingDraft: { ...s.onboardingDraft, ...patch },
      })),
      clearOnboardingDraft: () => set({ onboardingDraft: {} }),

      logout: () => set({ user: null, currentTeam: null }),

      // ===== AI settings =====
      aiSettings: {
        useOwnKey: false,
        userKey: "",
        provider: "gemini",
        model: "gemini-2.0-flash",
        baseUrl: "",
        usage: { build: 0, explain: 0, total: 0, limit: 100 },
      },
      setAiSettings: (patch) => set((s) => ({ aiSettings: { ...s.aiSettings, ...patch } })),
      bumpAiUsage: (kind) => set((s) => ({
        aiSettings: {
          ...s.aiSettings,
          usage: {
            ...s.aiSettings.usage,
            [kind]: (s.aiSettings.usage[kind] || 0) + 1,
            total: (s.aiSettings.usage.total || 0) + 1,
          },
        },
      })),

      // ===== Builder preferences (per user, local) =====
      builderSettings: {
        autoSaveRequests: false,
      },
      setBuilderSettings: (patch) => set((s) => ({
        builderSettings: { ...s.builderSettings, ...patch },
      })),

      // AI prompt history (browseable in the Ask AI dialog)
      aiPromptHistory: [],
      pushAiPrompt: (entry) => set((s) => ({
        aiPromptHistory: [{ id: nanoUid("p"), ts: Date.now(), ...entry }, ...s.aiPromptHistory].slice(0, 20),
      })),
      clearAiPrompts: () => set({ aiPromptHistory: [] }),

      // ===== AI sidebar =====
      aiSidebarOpen: true,
      aiSidebarWidth: 360,
      toggleAiSidebar: () => set((s) => ({ aiSidebarOpen: !s.aiSidebarOpen })),
      setAiSidebarOpen: (v) => set({ aiSidebarOpen: v }),
      setAiSidebarWidth: (w) => set({ aiSidebarWidth: Math.min(560, Math.max(280, w)) }),
      aiMessages: [],
      appendAiMessage: (msg) => set((s) => ({
        aiMessages: [...s.aiMessages, { ts: Date.now(), id: nanoUid("aim"), ...msg }],
      })),
      updateAiMessage: (id, patch) => set((s) => ({
        aiMessages: s.aiMessages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      })),
      clearAiMessages: () => set({ aiMessages: [] }),
      aiChatPrefill: "",
      aiChatAutoSend: false,
      aiChatPrefillToken: 0,
      queueAiChat: ({ text = "", autoSend = false }) => set({
        aiChatPrefill: text,
        aiChatAutoSend: autoSend,
        aiChatPrefillToken: Date.now(),
        aiSidebarOpen: true,
      }),
      clearAiChatPrefill: () => set({ aiChatPrefill: "", aiChatAutoSend: false, aiChatPrefillToken: 0 }),
      aiConduitRunResult: null,
      setAiConduitRunResult: (payload) => set({ aiConduitRunResult: payload }),
      clearAiConduitRunResult: () => set({ aiConduitRunResult: null }),
      aiPageContext: null,
      setAiPageContext: (ctx) => set({ aiPageContext: ctx }),

      // ===== Public share links =====
      shareLinks: {},
      createShareLink: (collectionId) => {
        const existing = get().shareLinks[collectionId];
        if (existing) return existing;
        const sid = nanoUid("s").replace("s_", "");
        set((s) => ({ shareLinks: { ...s.shareLinks, [collectionId]: sid } }));
        return sid;
      },
      revokeShareLink: (collectionId) => set((s) => {
        const { [collectionId]: _, ...rest } = s.shareLinks;
        return { shareLinks: rest };
      }),
      lookupShare: (shareId) => {
        const entries = Object.entries(get().shareLinks);
        const found = entries.find(([, sid]) => sid === shareId);
        if (!found) return null;
        const [colId] = found;
        const cols = Object.values(get().collectionsMap).flat();
        return cols.find((c) => c.id === colId) || null;
      },

      // ===== UI =====
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      commandOpen: false,
      setCommandOpen: (v) => set({ commandOpen: v }),
      sidebarWidth: 244,
      setSidebarWidth: (w) => set({ sidebarWidth: Math.min(380, Math.max(64, w)) }),
      builderPanels: {
        explorer: 22,
        builder: 45,
        response: 33,
        responseLayout: "bottom",
        responseOpen: true,
        stackRequest: 58,
        stackResponse: 42,
        consoleOpen: false,
        consoleHeight: 28,
      },
      setBuilderPanels: (next) => set({ builderPanels: { ...get().builderPanels, ...next } }),

      // ===== Builder session (survives module navigation) =====
      builderSession: {
        drafts: {},
        responses: {},
        testResults: {},
        activeExamples: {},
        consoleEntries: [],
        requestPanelTabs: {},
      },
      setBuilderDraft: (tabId, draft) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          drafts: { ...s.builderSession.drafts, [tabId]: draft },
        },
      })),
      clearBuilderDraft: (tabId) => set((s) => {
        const { [tabId]: _d, ...drafts } = s.builderSession.drafts;
        return { builderSession: { ...s.builderSession, drafts } };
      }),
      setBuilderResponse: (tabId, response) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          responses: { ...s.builderSession.responses, [tabId]: response },
        },
      })),
      clearBuilderResponse: (tabId) => set((s) => {
        const { [tabId]: _r, ...responses } = s.builderSession.responses;
        return { builderSession: { ...s.builderSession, responses } };
      }),
      setBuilderTestResults: (tabId, results) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          testResults: { ...s.builderSession.testResults, [tabId]: results },
        },
      })),
      appendBuilderConsoleEntries: (entries) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          consoleEntries: [
            ...(s.builderSession.consoleEntries || []),
            ...(Array.isArray(entries) ? entries : [entries]),
          ],
        },
      })),
      clearBuilderConsole: () => set((s) => ({
        builderSession: {
          ...s.builderSession,
          consoleEntries: [],
        },
      })),
      setBuilderRequestPanelTab: (tabId, panelTab) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          requestPanelTabs: { ...(s.builderSession.requestPanelTabs || {}), [tabId]: panelTab },
        },
      })),
      setBuilderActiveExample: (tabId, exampleId) => set((s) => ({
        builderSession: {
          ...s.builderSession,
          activeExamples: { ...s.builderSession.activeExamples, [tabId]: exampleId },
        },
      })),
      clearBuilderActiveExample: (tabId) => set((s) => {
        const { [tabId]: _e, ...activeExamples } = s.builderSession.activeExamples;
        return { builderSession: { ...s.builderSession, activeExamples } };
      }),
      clearBuilderTabSession: (tabId) => set((s) => {
        const { [tabId]: _d, ...drafts } = s.builderSession.drafts;
        const { [tabId]: _r, ...responses } = s.builderSession.responses;
        const { [tabId]: _t, ...testResults } = s.builderSession.testResults;
        const { [tabId]: _e, ...activeExamples } = s.builderSession.activeExamples;
        const { [tabId]: _p, ...requestPanelTabs } = s.builderSession.requestPanelTabs || {};
        return {
          builderSession: {
            drafts,
            responses,
            testResults,
            activeExamples,
            consoleEntries: s.builderSession.consoleEntries,
            requestPanelTabs,
          },
        };
      }),

      // ===== Builder tabs =====
      openTabs: [],         // [{ id: requestId | "scratch", collectionId, scratch, label }]
      activeTabId: null,
      openTab: ({ id, collectionId = null, label, scratch = false }) => {
        const existing = get().openTabs.find((t) => t.id === id);
        if (existing) { set({ activeTabId: id }); return; }
        set({
          openTabs: [...get().openTabs, { id, collectionId, label, scratch }],
          activeTabId: id,
        });
      },
      closeTab: (id) => {
        const tabs = get().openTabs.filter((t) => t.id !== id);
        let nextActive = get().activeTabId;
        if (nextActive === id) nextActive = tabs[tabs.length - 1]?.id || null;
        set({ openTabs: tabs, activeTabId: nextActive });
      },
      setActiveTab: (id) => set({ activeTabId: id }),
      renameTab: (id, label) => {
        set({
          openTabs: get().openTabs.map((tab) => (tab.id === id ? { ...tab, label } : tab)),
        });
      },
      reorderTabs: (fromId, toId) => {
        const tabs = [...get().openTabs];
        const fi = tabs.findIndex((t) => t.id === fromId);
        const ti = tabs.findIndex((t) => t.id === toId);
        if (fi < 0 || ti < 0) return;
        const [m] = tabs.splice(fi, 1);
        tabs.splice(ti, 0, m);
        set({ openTabs: tabs });
      },

      // ===== Data slices =====
      workspaces: [],
      activeWorkspaceId: null,
      collectionsMap: {},
      environmentsMap: {},
      history: [],
      team: [],
      mockServers: [],
      notifications: [],
      hydrateMock: () => set((s) => ensureSeed(s)),

      // ===== Workspaces =====
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id, openTabs: [], activeTabId: null }),
      createWorkspace: (name) => {
        const ws = { id: nanoUid("ws"), name, description: "", members: 1, createdAt: Date.now() };
        set((s) => ({
          workspaces: [...s.workspaces, ws],
          collectionsMap: { ...s.collectionsMap, [ws.id]: [] },
          environmentsMap: {
            ...s.environmentsMap,
            [ws.id]: [{
              id: nanoUid("env"), workspaceId: ws.id, collectionId: null,
              name: "Local", active: true,
              variables: [{ key: "BASE_URL", value: "http://localhost:8000", enabled: true }],
            }],
          },
        }));
        return ws;
      },
      renameWorkspace: (id, name) => set((s) => ({ workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name } : w)) })),
      duplicateWorkspace: (id) => {
        const ws = get().workspaces.find((w) => w.id === id);
        if (!ws) return;
        const copy = { ...ws, id: nanoUid("ws"), name: `${ws.name} Copy`, createdAt: Date.now() };
        const cols = (get().collectionsMap[id] || []).map((c) => ({
          ...c, id: nanoUid("col"), workspaceId: copy.id,
          requests: c.requests.map((r) => ({ ...r, id: nanoUid("req") })),
        }));
        const envs = (get().environmentsMap[id] || []).map((e) => ({ ...e, id: nanoUid("env"), workspaceId: copy.id }));
        set((s) => ({
          workspaces: [...s.workspaces, copy],
          collectionsMap: { ...s.collectionsMap, [copy.id]: cols },
          environmentsMap: { ...s.environmentsMap, [copy.id]: envs },
        }));
      },
      deleteWorkspace: (id) => set((s) => {
        if (s.workspaces.length <= 1) return s;
        const next = s.workspaces.filter((w) => w.id !== id);
        const { [id]: _c, ...colsRest } = s.collectionsMap;
        const { [id]: _e, ...envsRest } = s.environmentsMap;
        return {
          workspaces: next,
          activeWorkspaceId: s.activeWorkspaceId === id ? next[0]?.id : s.activeWorkspaceId,
          collectionsMap: colsRest,
          environmentsMap: envsRest,
        };
      }),

      // ===== Collections =====
      getCollections: () => get().collectionsMap[get().activeWorkspaceId] ?? EMPTY_ARRAY,
      findRequest: (requestId) => {
        const cols = get().collectionsMap[get().activeWorkspaceId] || [];
        for (const c of cols) {
          const r = c.requests.find((x) => x.id === requestId);
          if (r) return { request: r, collection: c };
        }
        return { request: null, collection: null };
      },
      createCollection: (name) => {
        const wsId = get().activeWorkspaceId;
        const c = {
          id: nanoUid("col"), workspaceId: wsId, name, description: "",
          folders: [], requests: [], archived: false, pinned: false, createdAt: Date.now(),
        };
        set((s) => ({ collectionsMap: { ...s.collectionsMap, [wsId]: [...(s.collectionsMap[wsId] || []), c] } }));
        return c;
      },
      updateCollection: (id, patch) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        }));
      },
      deleteCollection: (id) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).filter((c) => c.id !== id),
          },
        }));
      },
      duplicateCollection: (id) => {
        const wsId = get().activeWorkspaceId;
        const c = (get().collectionsMap[wsId] || []).find((x) => x.id === id);
        if (!c) return;
        const copy = {
          ...c, id: nanoUid("col"), name: `${c.name} Copy`,
          requests: c.requests.map((r) => ({ ...r, id: nanoUid("req") })),
        };
        set((s) => ({ collectionsMap: { ...s.collectionsMap, [wsId]: [...(s.collectionsMap[wsId] || []), copy] } }));
      },

      // ===== Folders =====
      addFolder: (collectionId, { name, parentId = null }) => {
        const wsId = get().activeWorkspaceId;
        const folder = { id: nanoUid("fld"), name: name || "New folder", parentId };
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId ? { ...c, folders: [...(c.folders || []), folder] } : c
            ),
          },
        }));
        return folder;
      },
      renameFolder: (collectionId, folderId, name) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId
                ? { ...c, folders: (c.folders || []).map((f) => (f.id === folderId ? { ...f, name } : f)) }
                : c
            ),
          },
        }));
      },
      deleteFolder: (collectionId, folderId) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) => {
              if (c.id !== collectionId) return c;
              return {
                ...c,
                folders: (c.folders || []).filter((f) => f.id !== folderId),
                requests: c.requests.map((r) => (r.folderId === folderId ? { ...r, folderId: null } : r)),
              };
            }),
          },
        }));
      },

      // ===== Requests =====
      addRequest: (collectionId, req) => {
        const wsId = get().activeWorkspaceId;
        const newReq = {
          id: nanoUid("req"),
          name: "Untitled request",
          method: "GET",
          url: "[[BASE_URL]]/",
          params: [],
          headers: [{ key: "Accept", value: "application/json", enabled: true }],
          auth: { type: "none" },
          body: { type: "none", content: "" },
          tests: "",
          preScript: "",
          starred: false,
          docs: "",
          examples: [],
          folderId: null,
          order: Date.now(),
          ...req,
        };
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId ? { ...c, requests: [...c.requests, newReq] } : c
            ),
          },
        }));
        return newReq;
      },
      updateRequest: (collectionId, requestId, patch) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId
                ? { ...c, requests: c.requests.map((r) => (r.id === requestId ? { ...r, ...patch } : r)) }
                : c
            ),
          },
        }));
      },
      deleteRequest: (collectionId, requestId) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) } : c
            ),
          },
          // also close any open tab for that request
          openTabs: get().openTabs.filter((t) => t.id !== requestId),
          activeTabId: get().activeTabId === requestId ? null : get().activeTabId,
        }));
      },
      moveRequest: (collectionId, requestId, { folderId = null }) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId
                ? { ...c, requests: c.requests.map((r) => (r.id === requestId ? { ...r, folderId } : r)) }
                : c
            ),
          },
        }));
      },
      reorderRequest: (collectionId, fromId, toId) => {
        if (fromId === toId) return;
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) => {
              if (c.id !== collectionId) return c;
              const arr = [...c.requests];
              const fi = arr.findIndex((r) => r.id === fromId);
              const ti = arr.findIndex((r) => r.id === toId);
              if (fi < 0 || ti < 0) return c;
              const [m] = arr.splice(fi, 1);
              // place into target's folder
              m.folderId = arr[ti]?.folderId ?? null;
              arr.splice(ti, 0, m);
              return { ...c, requests: arr.map((r, i) => ({ ...r, order: i })) };
            }),
          },
        }));
      },

      // ===== Examples =====
      addExample: (collectionId, requestId, example) => {
        const ex = { id: nanoUid("ex"), savedAt: Date.now(), ...example };
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId
                ? {
                    ...c,
                    requests: c.requests.map((r) =>
                      r.id === requestId ? { ...r, examples: [...(r.examples || []), ex] } : r
                    ),
                  }
                : c
            ),
          },
        }));
        return ex;
      },
      deleteExample: (collectionId, requestId, exampleId) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          collectionsMap: {
            ...s.collectionsMap,
            [wsId]: (s.collectionsMap[wsId] || []).map((c) =>
              c.id === collectionId
                ? {
                    ...c,
                    requests: c.requests.map((r) =>
                      r.id === requestId
                        ? { ...r, examples: (r.examples || []).filter((ex) => ex.id !== exampleId) }
                        : r
                    ),
                  }
                : c
            ),
          },
        }));
      },

      // ===== Environments =====
      getEnvironments: (opts = {}) => {
        const list = get().environmentsMap[get().activeWorkspaceId] ?? EMPTY_ARRAY;
        if (opts.collectionId === undefined) return list;
        return list.filter((e) => (e.collectionId || null) === (opts.collectionId || null));
      },
      getActiveEnvironment: () => {
        const list = get().environmentsMap[get().activeWorkspaceId] ?? EMPTY_ARRAY;
        return list.find((e) => e.active) || list[0];
      },
      setActiveEnvironment: (envId) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          environmentsMap: {
            ...s.environmentsMap,
            [wsId]: (s.environmentsMap[wsId] || []).map((e) => ({ ...e, active: e.id === envId })),
          },
        }));
      },
      createEnvironment: (payload) => {
        const wsId = get().activeWorkspaceId;
        const name = typeof payload === "string" ? payload : payload?.name || "New Environment";
        const collectionId = typeof payload === "object" ? payload?.collectionId || null : null;
        const env = {
          id: nanoUid("env"), workspaceId: wsId, collectionId,
          name, active: false,
          variables: [{ key: "BASE_URL", value: "https://api.example.com", enabled: true }],
        };
        set((s) => ({ environmentsMap: { ...s.environmentsMap, [wsId]: [...(s.environmentsMap[wsId] || []), env] } }));
        return env;
      },
      updateEnvironment: (id, patch) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          environmentsMap: {
            ...s.environmentsMap,
            [wsId]: (s.environmentsMap[wsId] || []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        }));
      },
      duplicateEnvironment: (id) => {
        const wsId = get().activeWorkspaceId;
        const env = (get().environmentsMap[wsId] || []).find((e) => e.id === id);
        if (!env) return;
        const copy = { ...env, id: nanoUid("env"), name: `${env.name} Copy`, active: false };
        set((s) => ({ environmentsMap: { ...s.environmentsMap, [wsId]: [...(s.environmentsMap[wsId] || []), copy] } }));
      },
      deleteEnvironment: (id) => {
        const wsId = get().activeWorkspaceId;
        set((s) => ({
          environmentsMap: {
            ...s.environmentsMap,
            [wsId]: (s.environmentsMap[wsId] || []).filter((e) => e.id !== id),
          },
        }));
      },

      // ===== Per-collection active environment =====
      activeEnvByCollection: {}, // { [collectionId]: envId } — overrides workspace active env
      setActiveEnvForCollection: (collectionId, envId) => set((s) => ({
        activeEnvByCollection: { ...s.activeEnvByCollection, [collectionId]: envId },
      })),
      getActiveEnvForCollection: (collectionId) => {
        const map = get().activeEnvByCollection;
        const envs = get().environmentsMap[get().activeWorkspaceId] || [];
        const explicit = map[collectionId];
        if (explicit) {
          const e = envs.find((x) => x.id === explicit);
          if (e) return e;
        }
        // fall back to collection-scoped env, then workspace-active
        const scoped = envs.find((e) => e.collectionId === collectionId);
        if (scoped) return scoped;
        return envs.find((e) => e.active) || envs[0];
      },

      // ===== History (server-synced cache; not persisted locally) =====
      history: [],
      setHistory: (entries) => set({ history: entries }),

      // ===== Mock servers =====
      createMockEndpoint: (m) => {
        const item = { id: nanoUid("mock"), enabled: true, delayMs: 0, status: 200, ...m };
        set((s) => ({ mockServers: [item, ...s.mockServers] }));
        return item;
      },
      updateMockEndpoint: (id, patch) =>
        set((s) => ({ mockServers: s.mockServers.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMockEndpoint: (id) => set((s) => ({ mockServers: s.mockServers.filter((m) => m.id !== id) })),

      // ===== Team =====
      addTeamMember: (m) => set((s) => ({ team: [{ id: nanoUid("usr"), online: false, lastActive: Date.now(), ...m }, ...s.team] })),
      updateTeamMember: (id, patch) => set((s) => ({ team: s.team.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTeamMember: (id) => set((s) => ({ team: s.team.filter((t) => t.id !== id) })),

      // ===== Notifications =====
      pushNotification: (n) =>
        set((s) => ({
          notifications: [{ id: nanoUid("ntf"), read: false, timestamp: Date.now(), type: "info", ...n }, ...s.notifications].slice(0, 60),
        })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "noidr-web-store",
      storage: createJSONStorage(() => localStorage),
      version: 7,
      migrate: (persisted, version) => {
        const state = persisted ?? {};
        if (version < 5 && state.builderSession) {
          state.builderSession = {
            ...state.builderSession,
            consoleEntries: state.builderSession.consoleEntries ?? [],
            requestPanelTabs: state.builderSession.requestPanelTabs ?? {},
          };
        }
        if (version < 6 && state.builderPanels) {
          state.builderPanels = {
            ...state.builderPanels,
            responseLayout: "bottom",
          };
        }
        if (version < 7) {
          delete state.history;
        }
        return state;
      },
      partialize: (s) => ({
        seeded: s.seeded,
        user: s.user,
        currentTeam: s.currentTeam,
        aiSettings: s.aiSettings,
        builderSettings: s.builderSettings,
        aiPromptHistory: s.aiPromptHistory,
        aiSidebarOpen: s.aiSidebarOpen,
        aiSidebarWidth: s.aiSidebarWidth,
        shareLinks: s.shareLinks,
        activeEnvByCollection: s.activeEnvByCollection,
        sidebarCollapsed: s.sidebarCollapsed,
        sidebarWidth: s.sidebarWidth,
        builderPanels: s.builderPanels,
        builderSession: s.builderSession,
        openTabs: s.openTabs,
        activeTabId: s.activeTabId,
        workspaces: s.workspaces,
        activeWorkspaceId: s.activeWorkspaceId,
        collectionsMap: s.collectionsMap,
        environmentsMap: s.environmentsMap,
        team: s.team,
        mockServers: s.mockServers,
        notifications: s.notifications,
      }),
    }
  )
);
