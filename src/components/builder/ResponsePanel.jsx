import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Editor from "@monaco-editor/react";
import StatusBadge from "@/components/shared/StatusBadge";
import { BUILDER } from "@/constants/testIds";
import { Send, Save, Sparkles, MoreHorizontal, PanelRight, PanelBottom, Check, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import TestResultsPanel from "@/components/builder/TestResultsPanel";
import {
  formatPrettyBody,
  getHtmlPreviewContent,
  inferPrettyLanguage,
  isHtmlResponse,
} from "@/lib/builder/response-format";
import { normalizeTestResults, summarizeTestResults, testsTabLabel } from "@/lib/builder/test-results";

function formatBytes(n) {
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function ResponseMeta({ response, isExampleView }) {
  const routeLabel = response.sendRoute === "cloud" || response.mode === "proxy"
    ? "Cloud"
    : response.sendRoute === "browser" || response.mode === "real"
      ? "Browser"
      : null;

  return (
    <>
      {isExampleView && (
        <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--brand))] font-soro border border-[hsl(var(--brand))]/30 bg-[hsl(var(--brand))]/10 px-1.5 py-0.5 rounded">
          Example
        </span>
      )}
      <StatusBadge status={response.status} className={"border-none text-[9px] bg-transparent"} />
      <span className="text-[12px] text-foreground/90" data-testid={BUILDER.responseStatus}>{response.statusText}</span>
      <span className="ml-auto text-[11px] text-muted-foreground font-soro" data-testid={BUILDER.responseTime}>
        {response.durationMs == null ? "—" : `${response.durationMs} ms`}
      </span>
      <span className="text-[11px] text-muted-foreground font-soro" data-testid={BUILDER.responseSize}>{formatBytes(response.sizeBytes)}</span>
    </>
  );
}

function LayoutMenu({ layout, onLayoutChange, onClose }) {
  const options = [
    { id: "side", label: "Right sidebar", icon: PanelRight },
    { id: "bottom", label: "Bottom panel", icon: PanelBottom },
  ];

  return (
    <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            data-testid="response-layout-menu"
            title="Response panel layout"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">Response position</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[hsl(var(--border))]" />
          {options.map(({ id, label, icon: Icon }) => (
            <DropdownMenuItem
              key={id}
              onClick={() => onLayoutChange(id)}
              className="text-[12px] gap-2 cursor-pointer"
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1">{label}</span>
              {layout === id && <Check className="h-3.5 w-3.5 text-[hsl(var(--brand))]" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          data-testid="response-close"
          title="Close response panel"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ResponseTabs({ response, tab, setTab, onExplain, onRetryViaCloud, testResults }) {
  const prettyLang = inferPrettyLanguage(response);
  const prettyValue = formatPrettyBody(response);
  const htmlResponse = isHtmlResponse(response);
  const htmlPreview = htmlResponse ? getHtmlPreviewContent(response) : "";
  const normalizedTests = normalizeTestResults(testResults);
  const testsLabel = testsTabLabel(normalizedTests);

  const tabs = htmlResponse
    ? [
        ["preview", "Preview"],
        ["pretty", "HTML"],
        ["raw", "Raw"],
        ["headers", `Headers (${Object.keys(response.headers || {}).length})`],
        ["cookies", `Cookies (${(response.cookies || []).length})`],
        ["tests", testsLabel],
      ]
    : [
        ["pretty", "Pretty"],
        ["raw", "Raw"],
        ["headers", `Headers (${Object.keys(response.headers || {}).length})`],
        ["cookies", `Cookies (${(response.cookies || []).length})`],
        ["tests", testsLabel],
      ];

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center border-b border-[hsl(var(--border))]">
        <TabsList className="bg-transparent rounded-none h-9 px-2 justify-start flex-1 min-w-0">
          {tabs.map(([k, label]) => (
            <TabsTrigger
              key={k}
              value={k}
              data-testid={BUILDER.responseTab(k)}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--brand))] rounded-none h-9 px-3 text-[12.5px] text-muted-foreground"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {onExplain && (
          <button
            onClick={onExplain}
            className="shrink-0 mr-2 h-7 px-2 rounded text-[11px] border border-[hsl(var(--brand))]/40 bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/20 inline-flex items-center gap-1"
            data-testid="response-explain"
            title={response.status >= 400 ? "What's wrong?" : "Explain this response"}
          >
            <Sparkles className="h-3 w-3" />
            {response.status >= 400 ? "What's wrong?" : "Explain"}
          </button>
        )}
      </div>

      {htmlResponse && (
        <TabsContent value="preview" className="flex-1 min-h-0 m-0 p-0 flex flex-col data-[state=inactive]:hidden">
          {htmlPreview.trim() ? (
            <div className="relative flex-1 min-h-[240px]">
              <iframe
                title="Response preview"
                sandbox=""
                srcDoc={htmlPreview}
                className="absolute inset-0 w-full h-full border-0 bg-white"
                data-testid="response-html-preview"
              />
            </div>
          ) : (
            <div className="p-6 text-center text-[12px] text-muted-foreground">
              No HTML content to preview. Check the Raw tab.
            </div>
          )}
        </TabsContent>
      )}

      <TabsContent value="pretty" className="flex-1 min-h-0 m-0 p-0 flex flex-col data-[state=inactive]:hidden">
        {response.corsBlocked && (
          <div className="mx-3 mt-3 rounded-md border border-[hsl(var(--warning))]/40 bg-[hsl(var(--warning))]/10 px-3 py-2 text-[12px] text-foreground/90 space-y-2">
            <div>{response.body?.message || "Browser blocked this request (CORS)."}</div>
            {onRetryViaCloud && (
              <button
                type="button"
                onClick={onRetryViaCloud}
                className="h-7 px-2.5 rounded-md text-[11.5px] font-medium border border-[hsl(var(--border))] hover:bg-accent/50"
              >
                Retry via cloud
              </button>
            )}
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage={prettyLang}
          language={prettyLang}
          value={prettyValue}
          theme="vs-dark"
          options={{
            readOnly: true, minimap: { enabled: false }, fontSize: 13,
            fontFamily: "JetBrains Mono, monospace", scrollBeyondLastLine: false,
            padding: { top: 12 }, lineNumbers: "on",
          }}
        />
      </TabsContent>

      <TabsContent value="raw" className="flex-1 min-h-0 m-0 p-3 overflow-auto">
        <pre className="text-[12px] font-soro text-foreground/90 whitespace-pre-wrap break-all">{response.rawText || JSON.stringify(response.body)}</pre>
      </TabsContent>

      <TabsContent value="headers" className="flex-1 min-h-0 m-0 p-0 overflow-auto">
        <div className="divide-y divide-[hsl(var(--border))]">
          {Object.entries(response.headers || {}).map(([k, v]) => (
            <div key={k} className="grid grid-cols-[180px_1fr] gap-2 px-3 py-2 text-[12px] font-soro">
              <div className="text-muted-foreground">{k}</div>
              <div className="text-foreground/90 break-all">{v}</div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="cookies" className="flex-1 min-h-0 m-0 p-0 overflow-auto">
        {response.cookies?.length ? (
          <div className="divide-y divide-[hsl(var(--border))]">
            {response.cookies.map((c, i) => (
              <div key={i} className="px-3 py-2 text-[12px] font-soro flex items-center gap-3">
                <span className="text-muted-foreground w-28 shrink-0">{c.name}</span>
                <span className="text-foreground/90 truncate flex-1">{c.value}</span>
                {c.httpOnly && <span className="text-[10px] text-[hsl(var(--brand))]">HttpOnly</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground text-[12px]">No cookies in response</div>
        )}
      </TabsContent>

      <TabsContent value="tests" className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=inactive]:hidden">
        <TestResultsPanel testResults={normalizedTests} />
      </TabsContent>
    </Tabs>
  );
}

function TestResultsOnlyPanel({ testResults, layout, onLayoutChange, onClose, sending }) {
  const normalizedTests = normalizeTestResults(testResults);

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--card))]">
      <div className="h-12 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))] gap-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-soro">Response</div>
        <span className="text-[12px] text-muted-foreground">
          {sending ? "Sending request…" : "Pre-request failed — see test results"}
        </span>
        <div className="ml-auto">
          <LayoutMenu layout={layout} onLayoutChange={onLayoutChange} onClose={onClose} />
        </div>
      </div>
      <TestResultsPanel testResults={normalizedTests} />
    </div>
  );
}

export default function ResponsePanel({
  response,
  isExampleView = false,
  sending = false,
  onSaveExample,
  onExplain,
  onRetryViaCloud = null,
  testResults = null,
  layout = "side",
  onLayoutChange,
  onClose,
}) {
  const [tab, setTab] = useState("pretty");
  const normalizedTests = normalizeTestResults(testResults);
  const testSummary = summarizeTestResults(normalizedTests);

  useEffect(() => {
    if (!response) return;
    if (testSummary.failed > 0) {
      setTab("tests");
      return;
    }
    setTab(isHtmlResponse(response) ? "preview" : "pretty");
  }, [response?.url, response?.status, response?.durationMs, testSummary.failed]);

  if (!response) {
    if (testSummary.hasActivity) {
      return (
        <TestResultsOnlyPanel
          testResults={normalizedTests}
          layout={layout}
          onLayoutChange={onLayoutChange}
          onClose={onClose}
          sending={sending}
        />
      );
    }

    return (
      <div className="h-full flex flex-col bg-[hsl(var(--card))]">
        <div className="h-12 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))] gap-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-soro">Response</div>
          <span className="text-[12px] text-muted-foreground">
            {sending ? "Sending request…" : "Send a request to see the response"}
          </span>
          <div className="ml-auto">
            <LayoutMenu layout={layout} onLayoutChange={onLayoutChange} onClose={onClose} />
          </div>
        </div>
        <div className="flex-1 grid place-items-center p-8 text-center">
          <div className="max-w-xs">
            <div className="mx-auto h-12 w-12 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input))] grid place-items-center mb-3">
              {sending ? (
                <Loader2 className="h-5 w-5 text-[hsl(var(--brand))] animate-spin" />
              ) : (
                <Send className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-[13px] text-foreground/90">
              {sending ? "Waiting for response…" : "Ready when you are."}
            </div>
            {!sending && (
              <div className="text-[12px] text-muted-foreground mt-1">Hit <kbd className="kbd">Send</kbd> to fire your request.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--card))]">
      <div className="h-8 shrink-0 flex items-center px-3 border-b border-[hsl(var(--border))] gap-3">
        <ResponseMeta response={response} isExampleView={isExampleView} />
        {onSaveExample && (
          <button
            onClick={onSaveExample}
            className={cn(
              "h-7 px-2  text-[11px] hover:bg-accent/50 inline-flex items-center gap-1",
              layout === "bottom" && "hidden sm:inline-flex",
            )}
            data-testid="response-save-example"
            title="Save as example response"
          >
            <Save className="h-3 w-3" /> Save as example
          </button>
        )}
        <LayoutMenu layout={layout} onLayoutChange={onLayoutChange} onClose={onClose} />
      </div>

      <ResponseTabs
        response={response}
        tab={tab}
        setTab={setTab}
        onExplain={onExplain}
        onRetryViaCloud={onRetryViaCloud}
        testResults={normalizedTests}
      />
    </div>
  );
}
