// Orchestrator for the 3-pane API Builder. Composed of small subcomponents
// in /app/frontend/src/components/builder/*. The Zustand store owns persistence
// (open tabs, panel widths, request data); this file only wires interactions.
import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";

const DEFAULT_SCRATCH = {
  id: "scratch",
  name: "Untitled request",
  method: "GET",
  url: "[[BASE_URL]]/users",
  params: [{ key: "page", value: "1", enabled: true }],
  headers: [{ key: "Accept", value: "application/json", enabled: true }],
  auth: { type: "bearer", token: "[[TOKEN]]" },
  body: { type: "none", content: "" },
  tests: "expect(response.status).toBe(200);",
  preScript: "",
  docs: "",
  examples: [],
  starred: false,
  collectionId: null,
};

export default function ApiBuilder() {
  const params = useParams();
  const navigate = useNavigate();
  const client = getClient();

  const collections = useAppStore(selectWorkspaceCollections);
  const findRequest = useAppStore((s) => s.findRequest);
  const activeTabIdFromStore = useAppStore((s) => s.activeTabId);
  const openTabsFromStore = useAppStore((s) => s.openTabs);
  const activeColIdForEnv = openTabsFromStore.find((t) => t.id === activeTabIdFromStore)?.collectionId || null;
  const activeEnv = useAppStore((s) =>
    activeColIdForEnv ? s.getActiveEnvForCollection(activeColIdForEnv) : s.getActiveEnvironment()
  );
  const addHistory = useAppStore((s) => s.addHistory);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const openTab = useAppStore((s) => s.openTab);
  const closeTab = useAppStore((s) => s.closeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const openTabs = useAppStore((s) => s.openTabs);
  const panels = useAppStore((s) => s.builderPanels);
  const setPanels = useAppStore((s) => s.setBuilderPanels);

  // Local editor state per tab (kept in component so unsaved edits live with the tab).
  // Map of tabId -> draft request
  const [drafts, setDrafts] = useState({});
  const [responses, setResponses] = useState({});  // tabId -> response
  const [testResults, setTestResults] = useState({}); // tabId -> results
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState("mock");
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  // Sync URL param → open tab
  useEffect(() => {
    if (!params.requestId) return;
    const found = findRequest(params.requestId);
    if (found.request) {
      openTab({ id: found.request.id, collectionId: found.collection.id, label: found.request.name });
    }
  }, [params.requestId, findRequest, openTab]);

  // If no tabs at all, open the scratch
  useEffect(() => {
    if (openTabs.length === 0) {
      openTab({ id: "scratch", scratch: true, label: "Scratch" });
    }
  }, [openTabs.length, openTab]);

  const activeReq = useMemo(() => {
    if (!activeTabId) return DEFAULT_SCRATCH;
    if (drafts[activeTabId]) return drafts[activeTabId];
    if (activeTabId === "scratch") return DEFAULT_SCRATCH;
    const f = findRequest(activeTabId);
    if (f.request) return { ...f.request, collectionId: f.collection.id, _lastResponse: responses[activeTabId] };
    return DEFAULT_SCRATCH;
  }, [activeTabId, drafts, findRequest, responses]);

  const setActiveReq = (next) => {
    setDrafts((d) => ({ ...d, [activeTabId]: { ...next, _lastResponse: responses[activeTabId] } }));
  };

  const finalUrl = useMemo(() => {
    const base = interpolate(activeReq.url, activeEnv);
    const qs = (activeReq.params || [])
      .filter((p) => p.enabled !== false && p.key)
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(interpolate(p.value, activeEnv))}`)
      .join("&");
    return qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
  }, [activeReq.url, activeReq.params, activeEnv]);

  const onSend = async () => {
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
    let collectionId = activeReq.collectionId;
    if (!collectionId) {
      let target = collections[0];
      if (!target) target = await client.createCollection("My Collection");
      collectionId = target.id;
    }
    if (activeReq.id === "scratch" || activeTabId === "scratch") {
      const saved = await client.addRequest(collectionId, {
        name: activeReq.name, method: activeReq.method, url: activeReq.url,
        params: activeReq.params, headers: activeReq.headers, auth: activeReq.auth,
        body: activeReq.body, tests: activeReq.tests, preScript: activeReq.preScript,
        docs: activeReq.docs, examples: activeReq.examples || [],
      });
      // close scratch, open saved
      closeTab("scratch");
      openTab({ id: saved.id, collectionId, label: saved.name });
      navigate(`/builder/${saved.id}`);
    } else {
      await client.updateRequest(collectionId, activeReq.id, {
        name: activeReq.name, method: activeReq.method, url: activeReq.url,
        params: activeReq.params, headers: activeReq.headers, auth: activeReq.auth,
        body: activeReq.body, tests: activeReq.tests, preScript: activeReq.preScript,
        docs: activeReq.docs,
      });
      // clear draft since persisted
      setDrafts((d) => { const c = { ...d }; delete c[activeTabId]; return c; });
    }
  };

  const onOpenRequest = (requestId, collectionId) => {
    const found = findRequest(requestId);
    openTab({ id: requestId, collectionId, label: found.request?.name || "Request" });
    navigate(`/builder/${requestId}`);
  };

  const onAddExample = (ex) => {
    if (!activeReq.collectionId || activeReq.id === "scratch") {
      toast.info("Save the request first to attach examples.");
      return null;
    }
    return client.addExample(activeReq.collectionId, activeReq.id, ex);
  };
  const onDeleteExample = (exId) => {
    if (!activeReq.collectionId) return;
    client.deleteExample(activeReq.collectionId, activeReq.id, exId);
  };
  const onSaveCurrentResponseAsExample = () => {
    const resp = responses[activeTabId];
    if (!resp) return;
    onAddExample({
      name: `Example ${(activeReq.examples?.length || 0) + 1}`,
      status: resp.status, statusText: resp.statusText,
      headers: resp.headers, body: resp.body, url: resp.url, method: resp.method,
    });
  };

  const newScratchTab = () => {
    openTab({ id: "scratch", scratch: true, label: "Scratch" });
  };

  const applyAISpec = (spec) => {
    if (!spec) return;
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
    [activeEnv]
  );

  return (
    <div className="h-full w-full flex flex-col">
      <RequestTabs onNewScratch={newScratchTab} />
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes) => setPanels({ explorer: sizes[0], builder: sizes[1], response: sizes[2] })}
            className="h-full"
          >
            <ResizablePanel defaultSize={panels.explorer || 22} minSize={14} maxSize={36}>
              <CollectionsExplorer
                activeRequestId={activeReq.id}
                onOpenRequest={onOpenRequest}
              />
            </ResizablePanel>

            <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

            <ResizablePanel defaultSize={panels.builder || 45} minSize={28}>
              <RequestPanel
                req={activeReq}
                onChange={setActiveReq}
                onSend={onSend}
                onSave={onSave}
                sending={sending}
                mode={mode}
                onToggleMode={() => setMode((m) => (m === "mock" ? "real" : "mock"))}
                testResults={testResults[activeTabId] || []}
                finalUrl={finalUrl}
                onAddExample={onAddExample}
                onDeleteExample={onDeleteExample}
                onAskAI={() => setAskAIOpen(true)}
              />
            </ResizablePanel>

            <ResizableHandle className="bg-[hsl(var(--border))] hover:bg-[hsl(var(--brand))]/40 w-px" />

            <ResizablePanel defaultSize={panels.response || 33} minSize={20}>
              <ResponsePanel
                response={responses[activeTabId]}
                onSaveExample={onSaveCurrentResponseAsExample}
                onExplain={() => setExplainOpen(true)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        {explainOpen && responses[activeTabId] && (
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
