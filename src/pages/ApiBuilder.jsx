// Orchestrator for the 3-pane API Builder. Composed of small subcomponents
// in /app/frontend/src/components/builder/*. The Zustand store owns persistence
// (open tabs, panel widths, request data); this file only wires interactions.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import CollectionsExplorer from "@/components/builder/CollectionsExplorer";
import RequestTabs from "@/components/builder/RequestTabs";
import RequestPanel from "@/components/builder/RequestPanel";
import ResponsePanel from "@/components/builder/ResponsePanel";
import { buildExplainPrompt } from "@/lib/builder/explain-prompt";
import BuilderConsolePanel from "@/components/builder/BuilderConsolePanel";
import BuilderStatusBar from "@/components/builder/BuilderStatusBar";

import { useRegisterAiPage } from "@/providers/AiContextProvider";
import { applyBuilderSpec, builderSnapshot } from "@/lib/ai/builder-spec";

import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import { getClient } from "@/lib/api/client";
import { interpolate } from "@/lib/mockEngine";
import { buildOutgoingHeaders } from "@/lib/builder/request-auth";
import { runPreRequestScript } from "@/lib/builder/pre-script";
import { ensureOAuthAuth, isOAuthConfigured } from "@/lib/builder/oauth";
import { resolveSendRoute } from "@/lib/builder/send-mode";
import {
  emptyTestResults,
  preScriptFailed,
  preScriptPassed,
  withPostResults,
} from "@/lib/builder/test-results";
import {
  createNetworkConsoleEntry,
  scriptLogsToConsoleEntries,
} from "@/lib/builder/builder-console";
import { getErrorMessage } from "@/hooks/use-auth";
import { useCollections } from "@/hooks/use-collections";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { applyOptimisticRequestPatch, useUpdateRequest } from "@/hooks/use-requests";
import { createEmptyScratch, createScratchTabId, isScratchTab } from "@/lib/builder/scratch";
import { buildRequestBreadcrumb } from "@/lib/builder/breadcrumb";
import { exampleToResponse, suggestExampleName } from "@/lib/builder/examples";
import { buildHistoryEntry } from "@/lib/builder/history";
import { isRequestUrlEmpty } from "@/lib/builder/url-variables";
import { isTabDirty } from "@/lib/builder/dirty";
import UnsavedTabDialog from "@/components/builder/UnsavedTabDialog";
import { toast } from "sonner";

function useBuilderSession() {
  const drafts = useAppStore((s) => s.builderSession.drafts);
  const responses = useAppStore((s) => s.builderSession.responses);
  const testResults = useAppStore((s) => s.builderSession.testResults);
  const activeExamples = useAppStore((s) => s.builderSession.activeExamples);
  const consoleEntries = useAppStore((s) => s.builderSession.consoleEntries);
  const setBuilderDraft = useAppStore((s) => s.setBuilderDraft);
  const clearBuilderDraft = useAppStore((s) => s.clearBuilderDraft);
  const setBuilderResponse = useAppStore((s) => s.setBuilderResponse);
  const setBuilderTestResults = useAppStore((s) => s.setBuilderTestResults);
  const appendBuilderConsoleEntries = useAppStore((s) => s.appendBuilderConsoleEntries);
  const clearBuilderConsole = useAppStore((s) => s.clearBuilderConsole);
  const setBuilderActiveExample = useAppStore((s) => s.setBuilderActiveExample);
  const clearBuilderActiveExample = useAppStore((s) => s.clearBuilderActiveExample);
  const clearBuilderTabSession = useAppStore((s) => s.clearBuilderTabSession);

  return {
    drafts,
    responses,
    testResults,
    activeExamples,
    consoleEntries,
    setBuilderDraft,
    clearBuilderDraft,
    setBuilderResponse,
    setBuilderTestResults,
    appendBuilderConsoleEntries,
    clearBuilderConsole,
    setBuilderActiveExample,
    clearBuilderActiveExample,
    clearBuilderTabSession,
  };
}

export default function ApiBuilder() {
  const params = useParams();
  const navigate = useNavigate();
  const client = getClient();
  useCollections();

  const collections = useAppStore(selectWorkspaceCollections);
  const findRequest = useAppStore((s) => s.findRequest);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const openTabs = useAppStore((s) => s.openTabs);
  const activeColIdForEnv = openTabs.find((t) => t.id === activeTabId)?.collectionId || null;
  const activeEnv = useAppStore((s) =>
    activeColIdForEnv ? s.getActiveEnvForCollection(activeColIdForEnv) : s.getActiveEnvironment(),
  );
  const pushNotification = useAppStore((s) => s.pushNotification);
  const openTab = useAppStore((s) => s.openTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const panels = useAppStore((s) => s.builderPanels);
  const autoSaveRequests = useAppStore((s) => s.builderSettings.autoSaveRequests);
  const setPanels = useAppStore((s) => s.setBuilderPanels);
  const {
    drafts,
    responses,
    testResults,
    activeExamples,
    consoleEntries,
    setBuilderDraft,
    clearBuilderDraft,
    setBuilderResponse,
    setBuilderTestResults,
    appendBuilderConsoleEntries,
    clearBuilderConsole,
    setBuilderActiveExample,
    clearBuilderActiveExample,
    clearBuilderTabSession,
  } = useBuilderSession();

  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const updateRequestMutation = useUpdateRequest();
  const queueAiChat = useAppStore((s) => s.queueAiChat);
  const [closePrompt, setClosePrompt] = useState(null);
  const [closeSaveCollectionId, setCloseSaveCollectionId] = useState(null);
  const activeReqRef = useRef(null);
  const activeTabIdRef = useRef(null);
  const activeEnvRef = useRef(null);
  const setActiveReqRef = useRef(() => {});
  const onSaveRef = useRef(null);

  const ensureScratchDraft = useCallback((tabId) => {
    if (!drafts[tabId]) {
      setBuilderDraft(tabId, createEmptyScratch(tabId));
    }
  }, [drafts, setBuilderDraft]);

  useEffect(() => {
    setAutoSaveStatus("idle");
  }, [activeTabId]);

  // URL param → open saved request tab
  useEffect(() => {
    if (!params.requestId) return;
    const found = findRequest(params.requestId);
    if (found.request) {
      openTab({ id: found.request.id, collectionId: found.collection.id, label: found.request.name });
    }
  }, [params.requestId, findRequest, openTab]);

  const activeReq = useMemo(() => {
    if (!activeTabId) return null;
    if (drafts[activeTabId]) return drafts[activeTabId];
    if (isScratchTab(activeTabId)) return createEmptyScratch(activeTabId);
    const f = findRequest(activeTabId);
    if (f.request) return { ...f.request, collectionId: f.collection.id };
    return null;
  }, [activeTabId, drafts, findRequest, collections]);

  const activeExampleId = activeTabId ? activeExamples[activeTabId] ?? null : null;

  const activeExample = useMemo(() => {
    if (!activeExampleId || !activeReq?.examples) return null;
    return activeReq.examples.find((example) => example.id === activeExampleId) || null;
  }, [activeExampleId, activeReq]);

  const displayResponse = useMemo(() => {
    if (activeExample) return exampleToResponse(activeExample);
    return activeTabId ? responses[activeTabId] : null;
  }, [activeExample, activeTabId, responses]);

  const setActiveReq = (next) => {
    if (!activeTabId) return;
    setBuilderDraft(activeTabId, next);
    scheduleAutoSave(activeTabId, next);
  };

  const buildRequestPayload = useCallback((req) => ({
    name: req.name || "Untitled request",
    method: req.method,
    url: req.url ?? "",
    params: req.params || [],
    headers: req.headers || [],
    auth: req.auth || { type: "none" },
    body: req.body || { type: "none", content: "" },
    tests: req.tests ?? "",
    preScript: req.preScript ?? "",
    docs: req.docs ?? "",
  }), []);

  const debouncedAutoSave = useDebouncedCallback(async (tabId, req) => {
    if (!req?.id || !req?.collectionId || isScratchTab(tabId)) return;
    setAutoSaveStatus("saving");
    try {
      const patch = buildRequestPayload(req);
      applyOptimisticRequestPatch(req.collectionId, req.id, patch);
      await updateRequestMutation.mutateAsync({
        collectionId: req.collectionId,
        requestId: req.id,
        patch,
      });
      clearBuilderDraft(tabId);
      setAutoSaveStatus("saved");
    } catch (err) {
      setAutoSaveStatus("error");
      toast.error(getErrorMessage(err, "Auto-save failed."));
    }
  }, 700);

  const scheduleAutoSave = useCallback((tabId, req) => {
    if (!autoSaveRequests) return;
    if (!req?.id || !req?.collectionId || isScratchTab(tabId)) return;
    debouncedAutoSave(tabId, req);
  }, [autoSaveRequests, debouncedAutoSave]);

  const finishCloseTab = useCallback((tabId) => {
    clearBuilderTabSession(tabId);
    closeTab(tabId);
    const nextActive = useAppStore.getState().activeTabId;
    if (nextActive && !isScratchTab(nextActive)) {
      navigate(`/builder/${nextActive}`);
    } else {
      navigate("/builder");
    }
  }, [clearBuilderTabSession, closeTab, navigate]);

  const attemptCloseTab = useCallback((tabId) => {
    const draft = drafts[tabId];
    const saved = isScratchTab(tabId) ? null : findRequest(tabId).request;
    const dirty = isTabDirty(tabId, draft, saved);
    if (!dirty) {
      finishCloseTab(tabId);
      return;
    }
    const tab = openTabs.find((t) => t.id === tabId);
    setCloseSaveCollectionId(
      draft?.collectionId || tab?.collectionId || collections[0]?.id || null,
    );
    setClosePrompt({
      tabId,
      label: draft?.name || saved?.name || tab?.label || "Untitled",
      isScratch: isScratchTab(tabId),
    });
  }, [collections, drafts, finishCloseTab, findRequest, openTabs]);

  const handleClosePromptSave = async () => {
    if (!closePrompt) return;
    const tabId = closePrompt.tabId;
    const draft = drafts[tabId] || activeReq;
    if (!draft) return;

    setSaving(true);
    try {
      const payload = {
        name: draft.name || "Untitled request",
        method: draft.method,
        url: draft.url ?? "",
        params: draft.params || [],
        headers: draft.headers || [],
        auth: draft.auth || { type: "none" },
        body: draft.body || { type: "none", content: "" },
        tests: draft.tests ?? "",
        preScript: draft.preScript ?? "",
        docs: draft.docs ?? "",
      };

      let collectionId = closeSaveCollectionId || draft.collectionId;
      if (!collectionId) {
        let target = collections[0];
        if (!target) target = await client.createCollection("My Collection");
        collectionId = target.id;
      }

      if (isScratchTab(tabId)) {
        const saved = await client.addRequest(collectionId, {
          ...payload,
          examples: draft.examples || [],
          folderId: draft.folderId || null,
        });
        finishCloseTab(tabId);
        openTab({ id: saved.id, collectionId, label: saved.name });
        navigate(`/builder/${saved.id}`);
        toast.success(`Saved ${saved.name}`);
      } else {
        await client.updateRequest(collectionId, draft.id, payload);
        clearBuilderDraft(tabId);
        finishCloseTab(tabId);
        toast.success("Request saved");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save request."));
    } finally {
      setSaving(false);
      setClosePrompt(null);
    }
  };

  const handleClosePromptDiscard = () => {
    if (!closePrompt) return;
    finishCloseTab(closePrompt.tabId);
    setClosePrompt(null);
  };

  const handleTabSelect = useCallback((tabId) => {
    if (isScratchTab(tabId)) {
      ensureScratchDraft(tabId);
      navigate("/builder");
      return;
    }
    navigate(`/builder/${tabId}`);
  }, [ensureScratchDraft, navigate]);

  const finalUrl = useMemo(() => {
    if (!activeReq) return "";
    const base = interpolate(activeReq.url, activeEnv);
    const qs = (activeReq.params || [])
      .filter((p) => p.enabled !== false && p.key)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(interpolate(p.value, activeEnv))}`)
      .join("&");
    return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
  }, [activeReq, activeEnv]);

  const executeSend = async ({ forceCloud = false } = {}) => {
    if (!activeReq || !activeTabId) return;
    if (isRequestUrlEmpty(activeReq.url)) {
      toast.error("Enter a request URL before sending.");
      return;
    }

    setPanels({ responseOpen: true });
    setSending(true);
    setBuilderActiveExample(activeTabId, null);
    setBuilderResponse(activeTabId, null);
    setBuilderTestResults(activeTabId, emptyTestResults());

    try {
      let sendReq = activeReq;
      let sendEnv = activeEnv;
      let testResultState = emptyTestResults();
      const envUpdates = {};
      const consoleBatch = [];

      const trackEnvSet = (key, value) => {
        envUpdates[key] = value;
      };

      const appendConsole = () => {
        if (!consoleBatch.length) return;
        appendBuilderConsoleEntries(consoleBatch);
      };

      if (activeReq.preScript?.trim()) {
        try {
          const preResult = runPreRequestScript(activeReq, activeEnv, activeReq.preScript, {
            onEnvSet: trackEnvSet,
          });
          sendReq = preResult.request;
          sendEnv = preResult.env;
          testResultState = preScriptPassed(preResult.logs);
          consoleBatch.push(...scriptLogsToConsoleEntries(preResult.logs));
        } catch (err) {
          const failed = preScriptFailed(err.message || "Pre-request script failed.", err.logs || []);
          setBuilderTestResults(activeTabId, failed);
          consoleBatch.push(...scriptLogsToConsoleEntries(err.logs || []));
          appendConsole();
          toast.error(err.message || "Pre-request script failed.");
          return;
        }
      }

      if (sendReq.auth?.type === "oauth2") {
        if (!isOAuthConfigured(sendReq.auth, sendEnv)) {
          toast.warning("OAuth 2.0 is selected but not configured — sending without an OAuth token.");
        } else {
          try {
            const oauthAuth = await ensureOAuthAuth(sendReq.auth, sendEnv);
            sendReq = { ...sendReq, auth: oauthAuth };
            if (JSON.stringify(oauthAuth) !== JSON.stringify(activeReq.auth)) {
              setBuilderDraft(activeTabId, sendReq);
            }
          } catch (err) {
            toast.error(getErrorMessage(err, "OAuth token request failed."));
            return;
          }
        }
      }

      const sendUrl = (() => {
        const base = interpolate(sendReq.url, sendEnv);
        const qs = (sendReq.params || [])
          .filter((p) => p.enabled !== false && p.key)
          .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(interpolate(p.value, sendEnv))}`)
          .join("&");
        return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
      })();

      const headers = buildOutgoingHeaders(sendReq, sendEnv);
      const route = resolveSendRoute({ url: sendUrl, forceCloud });
      const result = await client.send({
        method: sendReq.method,
        url: sendUrl,
        headers,
        body: sendReq.body,
        env: sendEnv,
        mode: route.viaProxy ? "proxy" : "real",
        viaProxy: route.viaProxy,
      });

      setBuilderResponse(activeTabId, result);
      const postRun = sendReq.tests?.trim()
        ? client.runTests(sendReq.tests, result, sendEnv, { onEnvSet: trackEnvSet })
        : { results: [], logs: [], env: sendEnv };
      sendEnv = postRun.env || sendEnv;
      setBuilderTestResults(activeTabId, withPostResults(testResultState, postRun));
      consoleBatch.push(createNetworkConsoleEntry({
        method: sendReq.method,
        url: result.url,
        status: result.status,
        statusText: result.statusText,
        durationMs: result.durationMs,
      }));
      consoleBatch.push(...scriptLogsToConsoleEntries(postRun.logs));
      appendConsole();

      for (const [key, value] of Object.entries(envUpdates)) {
        handleUpdateVariable(key, value);
      }
      const collection = collections.find((c) => c.id === sendReq.collectionId);
      try {
        await client.addHistory(buildHistoryEntry({
          request: sendReq,
          result,
          collectionName: collection?.name || "Scratch",
          requestId: isScratchTab(activeTabId) ? null : sendReq.id,
        }));
      } catch (historyErr) {
        console.warn("History save failed:", historyErr);
      }
      pushNotification({
        type: result.ok ? "success" : "danger",
        title: result.ok ? "Request succeeded" : "Request failed",
        desc: `${sendReq.method} ${result.url} → ${result.status}`,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Request failed."));
    } finally {
      setSending(false);
    }
  };

  const onSend = () => executeSend();
  const onRetryViaCloud = () => executeSend({ forceCloud: true });

  const onSave = async () => {
    if (!activeReq || !activeTabId) return;
    setSaving(true);
    try {
      const payload = buildRequestPayload(activeReq);

      let collectionId = activeReq.collectionId;
      if (!collectionId) {
        let target = collections[0];
        if (!target) target = await client.createCollection("My Collection");
        collectionId = target.id;
      }
      if (isScratchTab(activeTabId)) {
        const saved = await client.addRequest(collectionId, {
          ...payload,
          examples: activeReq.examples || [],
          folderId: activeReq.folderId || null,
        });
        const scratchId = activeTabId;
        closeTab(scratchId);
        clearBuilderTabSession(scratchId);
        openTab({ id: saved.id, collectionId, label: saved.name });
        navigate(`/builder/${saved.id}`);
        toast.success(`Saved ${saved.name}`);
      } else {
        await client.updateRequest(collectionId, activeReq.id, payload);
        clearBuilderDraft(activeTabId);
        toast.success("Request saved");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save request."));
    } finally {
      setSaving(false);
    }
  };
  onSaveRef.current = onSave;

  const onOpenRequest = (requestId, collectionId) => {
    const found = findRequest(requestId);
    clearBuilderDraft(requestId);
    openTab({ id: requestId, collectionId, label: found.request?.name || "Request" });
    clearBuilderActiveExample(requestId);
    navigate(`/builder/${requestId}`);
  };

  const onOpenExample = (requestId, collectionId, exampleId) => {
    const found = findRequest(requestId);
    openTab({ id: requestId, collectionId, label: found.request?.name || "Request" });
    setBuilderActiveExample(requestId, exampleId);
    setPanels({ responseOpen: true });
    navigate(`/builder/${requestId}`);
  };

  const handleExampleDeleted = useCallback((requestId, exampleId) => {
    if (activeExamples[requestId] === exampleId) {
      clearBuilderActiveExample(requestId);
    }
  }, [activeExamples, clearBuilderActiveExample]);

  const onAddExample = async (ex) => {
    if (!activeReq?.collectionId || isScratchTab(activeTabId)) {
      toast.info("Save the request first to attach examples.");
      return null;
    }
    try {
      return await client.addExample(activeReq.collectionId, activeReq.id, ex);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save example."));
      return null;
    }
  };

  const onDeleteExample = async (exId) => {
    if (!activeReq?.collectionId) return;
    try {
      await client.deleteExample(activeReq.collectionId, activeReq.id, exId);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete example."));
    }
  };

  const onSaveCurrentResponseAsExample = () => {
    if (isRequestUrlEmpty(activeReq?.url)) {
      toast.error("Add a URL before saving an example.");
      return;
    }
    const resp = responses[activeTabId];
    if (!resp || resp.mode === "mock") {
      toast.error("Send a real request before saving an example.");
      return;
    }
    onAddExample({
      name: suggestExampleName(activeReq?.examples, resp.status, resp.statusText),
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
      body: resp.body,
      url: resp.url,
      method: resp.method,
    });
  };

  const newScratchTab = () => {
    const id = createScratchTabId();
    setBuilderDraft(id, createEmptyScratch(id));
    openTab({ id, scratch: true, label: "Untitled" });
    navigate("/builder");
  };

  const handleUpdateVariable = useCallback(async (key, value) => {
    if (!activeEnv?.id) return;
    const variables = [...(activeEnv.variables || [])];
    const idx = variables.findIndex((v) => v.key === key);
    if (idx >= 0) {
      variables[idx] = { ...variables[idx], value };
    } else {
      variables.push({ key, value, enabled: true });
    }
    useAppStore.getState().updateEnvironment(activeEnv.id, { variables });
    try {
      await client.updateEnvironment(activeEnv.id, { variables });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update variable."));
    }
  }, [activeEnv, client]);

  const handleRequestRenamed = useCallback((requestId, name) => {
    const draft = drafts[requestId];
    if (draft) {
      setBuilderDraft(requestId, { ...draft, name });
    }
  }, [drafts, setBuilderDraft]);

  const requestBreadcrumb = useMemo(() => {
    if (!activeReq) return [];
    const found = isScratchTab(activeTabId) ? null : findRequest(activeTabId);
    return buildRequestBreadcrumb({
      request: activeReq,
      collection: found?.collection,
      isScratch: isScratchTab(activeTabId),
      example: activeExample,
    });
  }, [activeReq, activeTabId, activeExample, findRequest]);

  const explorerActiveId = activeReq && !isScratchTab(activeTabId) ? activeReq.id : null;

  const responseLayout = panels.responseLayout || "side";
  const responseOpen = panels.responseOpen !== false;
  const consoleOpen = panels.consoleOpen === true;
  const consoleHeight = panels.consoleHeight || 28;

  const handleToggleConsole = useCallback(() => {
    setPanels({ consoleOpen: !consoleOpen });
  }, [consoleOpen, setPanels]);

  const handleResponseLayoutChange = useCallback((layout) => {
    setPanels({ responseLayout: layout, responseOpen: true });
  }, [setPanels]);

  const handleResponseClose = useCallback(() => {
    setPanels({ responseOpen: false });
  }, [setPanels]);

  const handleOpenResponse = useCallback(() => {
    setPanels({ responseOpen: true });
  }, [setPanels]);

  activeReqRef.current = activeReq;
  activeTabIdRef.current = activeTabId;
  activeEnvRef.current = activeEnv;
  setActiveReqRef.current = setActiveReq;

  useRegisterAiPage("api-builder", {
    getSnapshot: () => {
      const tabId = activeTabIdRef.current;
      const req = activeReqRef.current;
      if (!req || !tabId) return { hasOpenRequest: false };

      const state = useAppStore.getState();
      const draft = state.builderSession.drafts[tabId];
      const saved = isScratchTab(tabId) ? null : state.findRequest(tabId).request;

      return builderSnapshot({
        activeTabId: tabId,
        activeReq: req,
        isDirty: isTabDirty(tabId, draft, saved),
        activeEnv: activeEnvRef.current,
      });
    },
    actionHandlers: {
      "builder.apply_draft": (payload) => {
        const req = activeReqRef.current;
        const tabId = activeTabIdRef.current;
        if (!req || !tabId) throw new Error("No request open.");
        if (!payload?.spec) throw new Error("Missing spec in payload.");
        setActiveReqRef.current(applyBuilderSpec(req, payload.spec));
        return { message: "Draft updated — review the request and save when ready." };
      },
      "builder.save_request": async () => {
        if (!onSaveRef.current) throw new Error("Nothing to save.");
        await onSaveRef.current();
        return { message: "Request saved to collection." };
      },
    },
  });

  const requestPane = activeReq ? (
    <RequestPanel
      req={activeReq}
      onChange={setActiveReq}
      onSend={onSend}
      onSave={onSave}
      sending={sending}
      saving={saving}
      autoSaveStatus={autoSaveRequests ? autoSaveStatus : "idle"}
      autoSaveEnabled={autoSaveRequests}
      finalUrl={finalUrl}
      breadcrumb={requestBreadcrumb}
      onAskAI={() => queueAiChat({ text: "Build an API request that ", autoSend: false })}
      collectionId={activeReq.collectionId || activeColIdForEnv}
      activeEnv={activeEnv}
      onUpdateVariable={handleUpdateVariable}
      responseOpen={responseOpen}
      onOpenResponse={handleOpenResponse}
    />
  ) : (
    <div className="h-full grid place-items-center text-center p-8 text-muted-foreground">
      <div>
        <p className="text-[14px] text-foreground/85">No request open</p>
        <p className="text-[12px] mt-1">Click + to start a new request, or pick one from the explorer.</p>
      </div>
    </div>
  );

  const handleExplainResponse = useCallback(() => {
    if (!displayResponse || activeExample) return;
    queueAiChat({
      text: buildExplainPrompt(displayResponse),
      autoSend: true,
    });
  }, [displayResponse, activeExample, queueAiChat]);

  const canSaveExample = Boolean(
    responses[activeTabId]
    && !activeExample
    && !isRequestUrlEmpty(activeReq?.url)
    && responses[activeTabId]?.mode !== "mock",
  );

  const responsePane = (
    <ResponsePanel
      response={displayResponse}
      isExampleView={Boolean(activeExample)}
      sending={sending && !displayResponse}
      onSaveExample={canSaveExample ? onSaveCurrentResponseAsExample : null}
      onExplain={activeExample ? null : handleExplainResponse}
      onRetryViaCloud={displayResponse?.corsBlocked ? onRetryViaCloud : null}
      testResults={testResults[activeTabId] || null}
      layout={responseLayout}
      onLayoutChange={handleResponseLayoutChange}
      onClose={handleResponseClose}
    />
  );

  const builderWorkspace = (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={(sizes) => {
        if (responseLayout === "side" && responseOpen) {
          setPanels({ explorer: sizes[0], builder: sizes[1], response: sizes[2] });
        } else {
          setPanels({ explorer: sizes[0], builder: sizes[1] });
        }
      }}
      className="h-full"
    >
      <ResizablePanel defaultSize={panels.explorer || 22} minSize={14} maxSize={36}>
        <CollectionsExplorer
          activeRequestId={explorerActiveId}
          activeExampleId={activeExampleId}
          onOpenRequest={onOpenRequest}
          onOpenExample={onOpenExample}
          onRequestRenamed={handleRequestRenamed}
          onExampleDeleted={handleExampleDeleted}
        />
      </ResizablePanel>

      <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

      {responseLayout === "side" ? (
        <>
          <ResizablePanel defaultSize={panels.builder || 45} minSize={28}>
            {requestPane}
          </ResizablePanel>

          {responseOpen && (
            <>
              <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

              <ResizablePanel defaultSize={panels.response || 33} minSize={20}>
                {responsePane}
              </ResizablePanel>
            </>
          )}
        </>
      ) : (
        <ResizablePanel defaultSize={panels.builder || 78} minSize={40}>
          {responseOpen ? (
            <ResizablePanelGroup
              direction="vertical"
              onLayout={(sizes) => setPanels({ stackRequest: sizes[0], stackResponse: sizes[1] })}
              className="h-full"
            >
              <ResizablePanel defaultSize={panels.stackRequest || 58} minSize={24}>
                {requestPane}
              </ResizablePanel>

              <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 h-px" />

              <ResizablePanel defaultSize={panels.stackResponse || 42} minSize={18}>
                {responsePane}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            requestPane
          )}
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );

  return (
    <div className="h-full w-full flex flex-col">
      <RequestTabs
        onNewScratch={newScratchTab}
        onTabSelect={handleTabSelect}
        onTabClose={attemptCloseTab}
        drafts={drafts}
      />
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {consoleOpen ? (
            <ResizablePanelGroup
              direction="vertical"
              onLayout={(sizes) => setPanels({ consoleHeight: sizes[1] })}
              className="h-full"
            >
              <ResizablePanel defaultSize={100 - consoleHeight} minSize={30}>
                {builderWorkspace}
              </ResizablePanel>
              <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 h-px" />
              <ResizablePanel defaultSize={consoleHeight} minSize={12}>
                <BuilderConsolePanel
                  entries={consoleEntries}
                  onClear={clearBuilderConsole}
                  onClose={() => setPanels({ consoleOpen: false })}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            builderWorkspace
          )}
        </div>
      </div>
      <BuilderStatusBar
        consoleOpen={consoleOpen}
        onToggleConsole={handleToggleConsole}
        consoleEntries={consoleEntries}
      />
      <UnsavedTabDialog
        open={Boolean(closePrompt)}
        onOpenChange={(open) => { if (!open) setClosePrompt(null); }}
        isScratch={closePrompt?.isScratch}
        tabLabel={closePrompt?.label}
        collections={collections}
        collectionId={closeSaveCollectionId}
        onCollectionChange={setCloseSaveCollectionId}
        onSave={handleClosePromptSave}
        onDiscard={handleClosePromptDiscard}
        saving={saving}
      />
    </div>
  );
}
