import { applyBuilderSpec } from "@/lib/ai/builder-spec";
import { buildDocsFromResponse } from "@/lib/ai/build-docs-from-response";
import { normalizeDocs } from "@/lib/docs/migrate";
import {
  formatResponseSummaryForChat,
  getActiveBuilderResponseSummary,
} from "@/lib/ai/response-summary";
import {
  renameExampleInList,
  setDefaultExampleInList,
  suggestExampleName,
} from "@/lib/builder/examples";
import { createEmptyScratch, isScratchTab } from "@/lib/builder/scratch";
import { emptyTestResults } from "@/lib/builder/test-results";
import { applyOptimisticRequestPatch, computeReorderedRequestIds } from "@/hooks/use-requests";
import { getClient } from "@/lib/api/client";
import { useAppStore } from "@/store/useAppStore";

function requireOpenDraft(ctx) {
  const req = ctx.activeReqRef?.current;
  const tabId = ctx.activeTabIdRef?.current;
  if (!req || !tabId) throw new Error("No request open in the builder.");
  return { req, tabId };
}

function patchDraft(ctx, patch) {
  const { req, tabId } = requireOpenDraft(ctx);
  ctx.setActiveReqRef.current({ ...req, ...patch });
  return { req: { ...req, ...patch }, tabId };
}

function patchKvRows(rows = [], payload, label) {
  const list = [...rows];
  if (payload.index != null) {
    const idx = Number(payload.index);
    if (idx < 0 || idx >= list.length) throw new Error(`${label} index ${idx} out of range.`);
    if (payload.patch) list[idx] = { ...list[idx], ...payload.patch };
    else list.splice(idx, 1);
    return list;
  }
  if (payload.key) {
    const idx = list.findIndex((r) => r.key === payload.key);
    if (idx < 0) throw new Error(`${label} key "${payload.key}" not found.`);
    if (payload.patch) list[idx] = { ...list[idx], ...payload.patch };
    else list.splice(idx, 1);
    return list;
  }
  throw new Error(`index or key required for ${label}.`);
}

function findCollection(collectionId) {
  const collections = useAppStore.getState().getCollections?.()
    || useAppStore.getState().collectionsMap?.[useAppStore.getState().activeWorkspaceId]
    || [];
  const collection = collections.find((c) => c.id === collectionId);
  if (!collection) throw new Error(`Collection "${collectionId}" not found.`);
  return collection;
}

function findRequestInCollection(collectionId, requestId) {
  const collection = findCollection(collectionId);
  const request = collection.requests?.find((r) => r.id === requestId);
  if (!request) throw new Error(`Request "${requestId}" not found.`);
  return { collection, request };
}

/**
 * Runtime executors for all API Builder page actions.
 * @param {React.MutableRefObject<Record<string, unknown>>} ctxRef
 */
export function createBuilderAiBindings(ctxRef) {
  const ctx = () => ctxRef.current;

  return {
    "builder.apply_draft": (payload) => {
      const { req } = requireOpenDraft(ctx());
      ctx().setActiveReqRef.current(applyBuilderSpec(req, payload.spec));
      return { message: "Draft updated — review the request and save when ready." };
    },

    "builder.discard_draft": () => {
      const tabId = ctx().activeTabIdRef?.current;
      if (!tabId) throw new Error("No tab open.");
      if (isScratchTab(tabId)) {
        ctx().setActiveReqRef.current?.(createEmptyScratch(tabId));
        return { message: "Scratch tab reset." };
      }
      useAppStore.getState().clearBuilderDraft(tabId);
      return { message: "Draft discarded — showing saved version." };
    },

    "builder.save_request": async () => {
      if (!ctx().onSaveRef?.current) throw new Error("Nothing to save.");
      await ctx().onSaveRef.current();
      return { message: "Request saved to collection." };
    },

    "builder.send_request": async () => {
      if (!ctx().executeSendRef?.current) throw new Error("No request open.");
      const out = await ctx().executeSendRef.current();
      if (!out?.result) throw new Error(out?.error || "Request did not complete.");
      return {
        message: formatResponseSummaryForChat(out.result),
        enrichAssistant: true,
      };
    },

    "builder.send_request_via_cloud": async () => {
      if (!ctx().executeSendRef?.current) throw new Error("No request open.");
      const out = await ctx().executeSendRef.current({ forceCloud: true });
      if (!out?.result) throw new Error(out?.error || "Request did not complete.");
      return {
        message: formatResponseSummaryForChat(out.result),
        enrichAssistant: true,
      };
    },

    "builder.summarize_response": () => {
      const summary = getActiveBuilderResponseSummary();
      if (!summary) throw new Error("No response yet — send the request first.");
      return { message: summary, enrichAssistant: true };
    },

    "builder.new_scratch_tab": () => {
      ctx().newScratchTab?.();
      return { message: "Opened a new scratch request tab." };
    },

    "builder.select_tab": (payload) => {
      const tabs = useAppStore.getState().openTabs;
      if (!tabs.some((t) => t.id === payload.tab_id)) {
        throw new Error(`Tab "${payload.tab_id}" is not open.`);
      }
      ctx().handleTabSelect?.(payload.tab_id);
      return { message: `Switched to tab "${payload.tab_id}".` };
    },

    "builder.close_tab": async (payload) => {
      if (payload.force === "discard") {
        ctx().finishCloseTab?.(payload.tab_id);
        return { message: "Tab closed (changes discarded)." };
      }
      if (payload.force === "save") {
        await ctx().closeTabSave?.(payload.tab_id);
        return { message: "Tab saved and closed." };
      }
      ctx().attemptCloseTab?.(payload.tab_id);
      return { message: "Close requested — unsaved tab may prompt the user." };
    },

    "builder.reorder_tabs": (payload) => {
      useAppStore.getState().reorderTabs(payload.from_tab_id, payload.to_tab_id);
      return { message: "Tab order updated." };
    },

    "builder.set_name": (payload) => {
      patchDraft(ctx(), { name: payload.name.trim() });
      return { message: `Request renamed to "${payload.name.trim()}".` };
    },

    "builder.set_method": (payload) => {
      patchDraft(ctx(), { method: payload.method.toUpperCase() });
      return { message: `Method set to ${payload.method.toUpperCase()}.` };
    },

    "builder.set_url": (payload) => {
      patchDraft(ctx(), { url: payload.url });
      return { message: "URL updated." };
    },

    "builder.set_params": (payload) => {
      patchDraft(ctx(), { params: payload.params });
      return { message: `Set ${payload.params.length} query param(s).` };
    },

    "builder.add_param": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const params = [...(req.params || []), {
        key: payload.key,
        value: payload.value ?? "",
        enabled: payload.enabled !== false,
      }];
      patchDraft(ctx(), { params });
      return { message: `Added param "${payload.key}".` };
    },

    "builder.update_param": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const params = patchKvRows(req.params || [], payload, "Param");
      patchDraft(ctx(), { params });
      return { message: "Query param updated." };
    },

    "builder.remove_param": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const params = patchKvRows(req.params || [], { ...payload, patch: null }, "Param");
      patchDraft(ctx(), { params });
      return { message: "Query param removed." };
    },

    "builder.set_headers": (payload) => {
      patchDraft(ctx(), { headers: payload.headers });
      return { message: `Set ${payload.headers.length} header(s).` };
    },

    "builder.add_header": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const headers = [...(req.headers || []), {
        key: payload.key,
        value: payload.value ?? "",
        enabled: payload.enabled !== false,
      }];
      patchDraft(ctx(), { headers });
      return { message: `Added header "${payload.key}".` };
    },

    "builder.update_header": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const headers = patchKvRows(req.headers || [], payload, "Header");
      patchDraft(ctx(), { headers });
      return { message: "Header updated." };
    },

    "builder.remove_header": (payload) => {
      const { req } = requireOpenDraft(ctx());
      const headers = patchKvRows(req.headers || [], { ...payload, patch: null }, "Header");
      patchDraft(ctx(), { headers });
      return { message: "Header removed." };
    },

    "builder.set_auth": (payload) => {
      patchDraft(ctx(), { auth: payload.auth });
      return { message: `Auth set to ${payload.auth.type || "none"}.` };
    },

    "builder.set_body_type": (payload) => {
      const { req } = requireOpenDraft(ctx());
      patchDraft(ctx(), { body: { ...req.body, type: payload.type } });
      return { message: `Body type set to ${payload.type}.` };
    },

    "builder.set_body_content": (payload) => {
      const { req } = requireOpenDraft(ctx());
      patchDraft(ctx(), { body: { ...req.body, content: payload.content } });
      return { message: "Body content updated." };
    },

    "builder.set_body_form_rows": (payload) => {
      const { req } = requireOpenDraft(ctx());
      patchDraft(ctx(), { body: { ...req.body, type: "form", formRows: payload.formRows } });
      return { message: `Set ${payload.formRows.length} form field(s).` };
    },

    "builder.set_pre_script": (payload) => {
      patchDraft(ctx(), { preScript: payload.preScript });
      return { message: "Pre-request script updated." };
    },

    "builder.set_tests": (payload) => {
      patchDraft(ctx(), { tests: payload.tests });
      return { message: "Tests script updated." };
    },

    "builder.set_docs": (payload) => {
      const raw = payload?.docs ?? payload?.content ?? payload?.markdown ?? payload?.text;
      if (raw == null || String(raw).trim() === "") {
        throw new Error("docs content is required (payload.docs as markdown string).");
      }
      const docs = normalizeDocs(String(raw));
      const { tabId } = requireOpenDraft(ctx());
      patchDraft(ctx(), { docs });
      useAppStore.getState().setBuilderRequestPanelTab(tabId, "docs");
      return { message: "Documentation updated on the open request." };
    },

    "builder.document_from_response": () => {
      const req = ctx().activeReqRef?.current;
      const tabId = ctx().activeTabIdRef?.current;
      if (!req || !tabId) throw new Error("No request open in the builder.");

      const response = useAppStore.getState().builderSession?.responses?.[tabId];
      if (!response) throw new Error("No response yet — send the request first.");

      const markdown = buildDocsFromResponse(req, response);
      if (!markdown) throw new Error("Could not build documentation from the response.");

      const docs = normalizeDocs(markdown);
      patchDraft(ctx(), { docs });
      useAppStore.getState().setBuilderRequestPanelTab(tabId, "docs");
      return { message: "Documentation generated from the last response." };
    },

    "builder.set_request_tab": (payload) => {
      const { tabId } = requireOpenDraft(ctx());
      useAppStore.getState().setBuilderRequestPanelTab(tabId, payload.tab);
      return { message: `Switched to ${payload.tab} tab.` };
    },

    "builder.ask_ai": (payload) => {
      ctx().queueAiChat?.({
        text: payload?.prompt || "Build an API request that ",
        autoSend: Boolean(payload?.auto_send),
      });
      return { message: "AI assistant opened with your prompt." };
    },

    "builder.set_environment": (payload) => {
      const state = useAppStore.getState();
      const collectionId = ctx().activeColIdRef?.current;
      if (collectionId) {
        state.setActiveEnvForCollection(collectionId, payload.environment_id);
      } else {
        state.setActiveEnvironment(payload.environment_id);
      }
      return { message: "Active environment updated." };
    },

    "builder.update_env_variable": async (payload) => {
      await ctx().handleUpdateVariable?.(payload.key, payload.value);
      return { message: `Variable "${payload.key}" updated.` };
    },

    "builder.open_response_panel": () => {
      ctx().handleOpenResponse?.();
      return { message: "Response panel opened." };
    },

    "builder.close_response_panel": () => {
      ctx().handleResponseClose?.();
      return { message: "Response panel closed." };
    },

    "builder.set_response_layout": (payload) => {
      ctx().handleResponseLayoutChange?.(payload.layout);
      return { message: `Response layout set to ${payload.layout}.` };
    },

    "builder.clear_response": () => {
      const { tabId } = requireOpenDraft(ctx());
      const state = useAppStore.getState();
      state.setBuilderResponse(tabId, null);
      state.setBuilderTestResults(tabId, emptyTestResults());
      state.clearBuilderActiveExample(tabId);
      return { message: "Response cleared for open tab." };
    },

    "builder.explain_response": () => {
      ctx().handleExplainResponse?.();
      return { message: "Queued response explanation in the AI assistant." };
    },

    "builder.save_response_as_example": async (payload) => {
      if (payload?.name) {
        const result = await ctx().onAddExample?.({
          name: payload.name,
          ...(ctx().buildExampleFromResponse?.() || {}),
        });
        if (!result) throw new Error("Could not save example.");
        return { message: `Saved example "${payload.name}".` };
      }
      ctx().onSaveCurrentResponseAsExample?.();
      return { message: "Saved last response as example." };
    },

    "builder.open_example": (payload) => {
      const found = useAppStore.getState().findRequest(payload.request_id);
      if (!found.request) throw new Error(`Request "${payload.request_id}" not found.`);
      ctx().onOpenExample?.(payload.request_id, found.collection.id, payload.example_id);
      return { message: "Opened example in response panel." };
    },

    "builder.add_example": async (payload) => {
      const client = getClient();
      const example = payload.example;
      await client.addExample(payload.collection_id, payload.request_id, example);
      return { message: `Added example "${example.name}".` };
    },

    "builder.delete_example": async (payload) => {
      const client = getClient();
      await client.deleteExample(payload.collection_id, payload.request_id, payload.example_id);
      ctx().handleExampleDeleted?.(payload.request_id, payload.example_id);
      return { message: "Example deleted." };
    },

    "builder.rename_example": async (payload) => {
      const { collection, request } = findRequestInCollection(payload.collection_id, payload.request_id);
      const examples = renameExampleInList(request.examples, payload.example_id, payload.name);
      applyOptimisticRequestPatch(payload.collection_id, payload.request_id, { examples });
      await getClient().updateRequest(payload.collection_id, payload.request_id, { examples });
      return { message: `Example renamed to "${payload.name.trim()}".` };
    },

    "builder.set_default_example": async (payload) => {
      const { request } = findRequestInCollection(payload.collection_id, payload.request_id);
      const examples = setDefaultExampleInList(request.examples, payload.example_id);
      applyOptimisticRequestPatch(payload.collection_id, payload.request_id, { examples });
      await getClient().updateRequest(payload.collection_id, payload.request_id, { examples });
      return { message: "Default example updated." };
    },

    "builder.toggle_console": () => {
      const open = useAppStore.getState().builderPanels?.consoleOpen === true;
      ctx().setPanels?.({ consoleOpen: !open });
      return { message: open ? "Console closed." : "Console opened." };
    },

    "builder.open_console": () => {
      ctx().setPanels?.({ consoleOpen: true });
      return { message: "Console opened." };
    },

    "builder.close_console": () => {
      ctx().setPanels?.({ consoleOpen: false });
      return { message: "Console closed." };
    },

    "builder.clear_console": () => {
      useAppStore.getState().clearBuilderConsole();
      return { message: "Console cleared." };
    },

    "builder.create_collection": async (payload) => {
      const created = await getClient().createCollection(payload.name.trim());
      return { message: `Created collection "${created.name}".`, data: { collectionId: created.id } };
    },

    "builder.delete_collection": async (payload) => {
      await getClient().deleteCollection(payload.collection_id);
      return { message: "Collection deleted." };
    },

    "builder.duplicate_collection": async (payload) => {
      const dup = await getClient().duplicateCollection(payload.collection_id);
      return { message: `Duplicated as "${dup.name}".`, data: { collectionId: dup.id } };
    },

    "builder.create_folder": async (payload) => {
      await getClient().addFolder(payload.collection_id, {
        name: payload.name.trim(),
        parentId: payload.parent_id ?? null,
      });
      return { message: `Created folder "${payload.name.trim()}".` };
    },

    "builder.rename_folder": async (payload) => {
      await getClient().renameFolder(payload.collection_id, payload.folder_id, payload.name.trim());
      return { message: "Folder renamed." };
    },

    "builder.delete_folder": async (payload) => {
      await getClient().deleteFolder(payload.collection_id, payload.folder_id);
      return { message: "Folder deleted." };
    },

    "builder.create_request": async (payload, { navigate }) => {
      const client = getClient();
      const saved = await client.addRequest(payload.collection_id, {
        name: payload.name || "Untitled request",
        method: payload.method || "GET",
        url: payload.url ?? "",
        params: payload.params || [],
        headers: payload.headers || [],
        auth: payload.auth || { type: "none" },
        body: payload.body || { type: "none", content: "" },
        tests: payload.tests ?? "",
        preScript: payload.preScript ?? "",
        folderId: payload.folder_id ?? null,
      });
      useAppStore.getState().openTab({
        id: saved.id,
        collectionId: payload.collection_id,
        label: saved.name,
      });
      navigate?.(`/builder/${saved.id}`);
      return { message: `Created and opened "${saved.name}".`, data: { requestId: saved.id } };
    },

    "builder.delete_request": async (payload) => {
      await getClient().deleteRequest(payload.collection_id, payload.request_id);
      useAppStore.getState().closeTab(payload.request_id);
      useAppStore.getState().clearBuilderTabSession(payload.request_id);
      return { message: "Request deleted." };
    },

    "builder.rename_request": async (payload) => {
      const name = payload.name.trim();
      applyOptimisticRequestPatch(payload.collection_id, payload.request_id, { name });
      useAppStore.getState().renameTab(payload.request_id, name);
      await getClient().updateRequest(payload.collection_id, payload.request_id, { name });
      return { message: `Request renamed to "${name}".` };
    },

    "builder.move_request": async (payload) => {
      useAppStore.getState().moveRequest(
        payload.collection_id,
        payload.request_id,
        { folderId: payload.folder_id ?? null },
      );
      await getClient().moveRequest(payload.collection_id, payload.request_id, {
        folderId: payload.folder_id ?? null,
      });
      return { message: "Request moved." };
    },

    "builder.reorder_request": async (payload) => {
      const collection = findCollection(payload.collection_id);
      const { requestIds: _requestIds, folderId } = computeReorderedRequestIds(
        collection,
        payload.from_request_id,
        payload.to_request_id,
      );
      useAppStore.getState().reorderRequest(payload.collection_id, payload.from_request_id, payload.to_request_id);
      await getClient().reorderRequest(payload.collection_id, payload.from_request_id, payload.to_request_id);
      const moved = collection.requests.find((r) => r.id === payload.from_request_id);
      if (moved && moved.folderId !== folderId) {
        await getClient().moveRequest(payload.collection_id, payload.from_request_id, { folderId });
      }
      return { message: "Request order updated." };
    },

    "builder.patch_saved_request": async (payload) => {
      applyOptimisticRequestPatch(payload.collection_id, payload.request_id, payload.patch);
      await getClient().updateRequest(payload.collection_id, payload.request_id, payload.patch);
      return { message: "Saved request updated on server." };
    },
  };
}

/** Build example payload from the active tab's last response (for save_response_as_example). */
export function buildExampleFromActiveResponse(activeTabId, activeReq, responses) {
  const resp = responses[activeTabId];
  if (!resp || resp.mode === "mock") return null;
  return {
    name: suggestExampleName(activeReq?.examples, resp.status, resp.statusText),
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers,
    body: resp.body,
    url: resp.url,
    method: resp.method,
  };
}
