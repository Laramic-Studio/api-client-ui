// Orchestrator for the 3-pane API Builder. Composed of small subcomponents
// in /app/frontend/src/components/builder/*. The Zustand store owns persistence
// (open tabs, panel widths, request data); this file only wires interactions.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import CollectionsExplorer from "@/components/builder/CollectionsExplorer";
import RequestTabs from "@/components/builder/RequestTabs";
import RequestPanel from "@/components/builder/RequestPanel";
import ResponsePanel from "@/components/builder/ResponsePanel";
import AskAIDialog from "@/components/builder/AskAIDialog";
import ExplainPanel from "@/components/builder/ExplainPanel";

import { useAppStore } from "@/store/useAppStore";
import { selectWorkspaceCollections } from "@/lib/store/selectors";
import { getClient } from "@/lib/api/client";
import { interpolate } from "@/lib/mockEngine";
import { getErrorMessage } from "@/hooks/use-auth";
import { useCollections } from "@/hooks/use-collections";
import { createEmptyScratch, createScratchTabId, isScratchTab } from "@/lib/builder/scratch";
import { toast } from "sonner";

function pruneTabState(setter, tabId) {
  setter((state) => {
    if (!state[tabId]) return state;
    const next = { ...state };
    delete next[tabId];
    return next;
  });
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
  const addHistory = useAppStore((s) => s.addHistory);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const openTab = useAppStore((s) => s.openTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const panels = useAppStore((s) => s.builderPanels);
  const setPanels = useAppStore((s) => s.setBuilderPanels);

  const [drafts, setDrafts] = useState({});
  const [responses, setResponses] = useState({});
  const [testResults, setTestResults] = useState({});
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("mock");
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const ensureScratchDraft = useCallback((tabId) => {
    setDrafts((d) => (d[tabId] ? d : { ...d, [tabId]: createEmptyScratch(tabId) }));
  }, []);

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
  }, [activeTabId, drafts, findRequest]);

  const setActiveReq = (next) => {
    if (!activeTabId) return;
    setDrafts((d) => ({ ...d, [activeTabId]: next }));
  };

  const handleTabClose = useCallback((tabId) => {
    pruneTabState(setDrafts, tabId);
    pruneTabState(setResponses, tabId);
    pruneTabState(setTestResults, tabId);

    const nextActive = useAppStore.getState().activeTabId;
    if (nextActive && !isScratchTab(nextActive)) {
      navigate(`/builder/${nextActive}`);
    } else {
      navigate("/builder");
    }
  }, [navigate]);

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

  const onSend = async () => {
    if (!activeReq || !activeTabId) return;
    setSending(true);
    setResponses((r) => ({ ...r, [activeTabId]: null }));
    const headers = [...(activeReq.headers || [])];
    if (activeReq.auth?.type === "bearer" && activeReq.auth.token) {
      headers.push({ key: "Authorization", value: `Bearer ${interpolate(activeReq.auth.token, activeEnv)}`, enabled: true });
    } else if (activeReq.auth?.type === "basic" && activeReq.auth.username) {
      const cred = btoa(`${activeReq.auth.username}:${activeReq.auth.password || ""}`);
      headers.push({ key: "Authorization", value: `Basic ${cred}`, enabled: true });
    } else if (activeReq.auth?.type === "apikey") {
      headers.push({
        key: activeReq.auth.headerName || "X-API-Key",
        value: interpolate(activeReq.auth.value || "", activeEnv),
        enabled: true,
      });
    }
    const result = await client.send({
      method: activeReq.method,
      url: finalUrl,
      headers,
      body: activeReq.body,
      env: activeEnv,
      mode,
    });
    setResponses((r) => ({ ...r, [activeTabId]: result }));
    setSending(false);
    const tr = client.runTests(activeReq.tests, result);
    setTestResults((t) => ({ ...t, [activeTabId]: tr }));
    addHistory({
      method: activeReq.method,
      url: result.url,
      status: result.status,
      durationMs: result.durationMs,
      sizeBytes: result.sizeBytes,
      collectionName: collections.find((c) => c.id === activeReq.collectionId)?.name || "Scratch",
    });
    pushNotification({
      type: result.ok ? "success" : "danger",
      title: result.ok ? "Request succeeded" : "Request failed",
      desc: `${activeReq.method} ${result.url} → ${result.status}`,
    });
  };

  const onSave = async () => {
    if (!activeReq || !activeTabId) return;
    setSaving(true);
    try {
      let collectionId = activeReq.collectionId;
      if (!collectionId) {
        let target = collections[0];
        if (!target) target = await client.createCollection("My Collection");
        collectionId = target.id;
      }
      if (isScratchTab(activeTabId)) {
        const saved = await client.addRequest(collectionId, {
          name: activeReq.name,
          method: activeReq.method,
          url: activeReq.url,
          params: activeReq.params,
          headers: activeReq.headers,
          auth: activeReq.auth,
          body: activeReq.body,
          tests: activeReq.tests,
          preScript: activeReq.preScript,
          docs: activeReq.docs,
          examples: activeReq.examples || [],
          folderId: activeReq.folderId || null,
        });
        const scratchId = activeTabId;
        closeTab(scratchId);
        pruneTabState(setDrafts, scratchId);
        openTab({ id: saved.id, collectionId, label: saved.name });
        navigate(`/builder/${saved.id}`);
        toast.success(`Saved ${saved.name}`);
      } else {
        await client.updateRequest(collectionId, activeReq.id, {
          name: activeReq.name,
          method: activeReq.method,
          url: activeReq.url,
          params: activeReq.params,
          headers: activeReq.headers,
          auth: activeReq.auth,
          body: activeReq.body,
          tests: activeReq.tests,
          preScript: activeReq.preScript,
          docs: activeReq.docs,
        });
        setDrafts((d) => { const c = { ...d }; delete c[activeTabId]; return c; });
        toast.success("Request saved");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not save request."));
    } finally {
      setSaving(false);
    }
  };

  const onOpenRequest = (requestId, collectionId) => {
    const found = findRequest(requestId);
    openTab({ id: requestId, collectionId, label: found.request?.name || "Request" });
    navigate(`/builder/${requestId}`);
  };

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
    const resp = responses[activeTabId];
    if (!resp) return;
    onAddExample({
      name: `Example ${(activeReq?.examples?.length || 0) + 1}`,
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
    setDrafts((d) => ({ ...d, [id]: createEmptyScratch(id) }));
    openTab({ id, scratch: true, label: "Untitled" });
    navigate("/builder");
  };

  const applyAISpec = (spec) => {
    if (!spec || !activeReq) return;
    setActiveReq({
      ...activeReq,
      name: spec.name || activeReq.name || "AI request",
      method: spec.method || activeReq.method,
      url: spec.url || activeReq.url,
      params: spec.params || [],
      headers: spec.headers || activeReq.headers || [],
      body: spec.body || activeReq.body || { type: "none", content: "" },
      tests: spec.tests ?? activeReq.tests,
    });
  };

  const envVarNames = useMemo(
    () => (activeEnv?.variables || []).filter((v) => v.enabled !== false).map((v) => v.key),
    [activeEnv],
  );

  const explorerActiveId = activeReq && !isScratchTab(activeTabId) ? activeReq.id : null;

  return (
    <div className="h-full w-full flex flex-col">
      <RequestTabs
        onNewScratch={newScratchTab}
        onTabSelect={handleTabSelect}
        onTabClose={handleTabClose}
      />
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes) => setPanels({ explorer: sizes[0], builder: sizes[1], response: sizes[2] })}
            className="h-full"
          >
            <ResizablePanel defaultSize={panels.explorer || 22} minSize={14} maxSize={36}>
              <CollectionsExplorer
                activeRequestId={explorerActiveId}
                onOpenRequest={onOpenRequest}
              />
            </ResizablePanel>

            <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

            <ResizablePanel defaultSize={panels.builder || 45} minSize={28}>
              {activeReq ? (
                <RequestPanel
                  req={activeReq}
                  onChange={setActiveReq}
                  onSend={onSend}
                  onSave={onSave}
                  sending={sending}
                  saving={saving}
                  mode={mode}
                  onToggleMode={() => setMode((m) => (m === "mock" ? "real" : "mock"))}
                  testResults={testResults[activeTabId] || []}
                  finalUrl={finalUrl}
                  onAddExample={onAddExample}
                  onDeleteExample={onDeleteExample}
                  onAskAI={() => setAskAIOpen(true)}
                />
              ) : (
                <div className="h-full grid place-items-center text-center p-8 text-muted-foreground">
                  <div>
                    <p className="text-[14px] text-foreground/85">No request open</p>
                    <p className="text-[12px] mt-1">Click + to start a new request, or pick one from the explorer.</p>
                  </div>
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

            <ResizablePanel defaultSize={panels.response || 33} minSize={20}>
              <ResponsePanel
                response={activeTabId ? responses[activeTabId] : null}
                onSaveExample={onSaveCurrentResponseAsExample}
                onExplain={() => setExplainOpen(true)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        {explainOpen && activeTabId && responses[activeTabId] && (
          <ExplainPanel response={responses[activeTabId]} onClose={() => setExplainOpen(false)} />
        )}
      </div>
      <AskAIDialog
        open={askAIOpen}
        onOpenChange={setAskAIOpen}
        envVars={envVarNames}
        onApply={applyAISpec}
      />
    </div>
  );
}
