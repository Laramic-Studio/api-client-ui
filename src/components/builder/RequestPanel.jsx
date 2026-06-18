// The middle pane of the builder: method+URL+send row, plus the request tabs
// (Params, Authorization, Headers, Body, Pre-request, Tests, Docs).
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Save, Send, Play, Code2, Copy, Sparkles, Loader2, ChevronRight, PanelRight,
} from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Editor from "@monaco-editor/react";
import MethodBadge from "@/components/shared/MethodBadge";
import UrlInput from "@/components/builder/UrlInput";
import EnvPicker from "@/components/builder/EnvPicker";
import KvEditor from "@/components/builder/KvEditor";
import AuthEditor from "@/components/builder/AuthEditor";
import TestsPanel from "@/components/builder/TestsPanel";
import DocsPanel from "@/components/builder/DocsPanel";
import { METHODS_LIST } from "@/lib/mockData";
import { GENERATORS } from "@/lib/generators";
import { CODE_LANGS, generateCode } from "@/lib/codeGen";
import { BUILDER } from "@/constants/testIds";
import { cn } from "@/lib/utils";
import { isRequestUrlEmpty } from "@/lib/builder/url-variables";
import { toast } from "sonner";

const BODY_TYPES = [
  { id: "none", label: "None", lang: null },
  { id: "json", label: "JSON", lang: "json" },
  { id: "xml", label: "XML", lang: "xml" },
  { id: "raw", label: "Raw Text", lang: "plaintext" },
  { id: "form", label: "Form Data", lang: null },
  // { id: "graphql", label: "GraphQL", lang: "graphql" },
];

const TAB_CONTENT_CLASS = "flex-1 min-h-0 m-0 mt-0 p-0 overflow-hidden data-[state=inactive]:hidden flex flex-col";

export default function RequestPanel({
  req, onChange, onSend, onSave, sending, saving,
  testResults, finalUrl, breadcrumb = [],
  onAskAI,
  collectionId = null,
  activeEnv = null,
  onUpdateVariable,
  responseOpen = true,
  onOpenResponse,
}) {
  const [activeTab, setActiveTab] = useState("params");
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeLang, setCodeLang] = useState("curl");
  const urlEmpty = isRequestUrlEmpty(req?.url);
  const canSend = !urlEmpty && !sending;

  const handleSend = () => {
    if (urlEmpty) {
      toast.error("Enter a request URL before sending.");
      return;
    }
    onSend();
  };

  const codeSnippet = useMemo(
    () => generateCode(codeLang, { ...req, url: finalUrl }),
    [codeLang, req, finalUrl]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-[hsl(var(--border))]">
        <nav
          className="flex-1 min-w-0 flex items-center gap-1 text-[12px] text-muted-foreground"
          aria-label="Request breadcrumb"
          data-testid="builder-breadcrumb"
        >
          {breadcrumb.map((part, index) => (
            <span key={`${part.label}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />}
              <span
                className={cn(
                  "truncate",
                  index === breadcrumb.length - 1 ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {part.label}
              </span>
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowCodeGen((v) => !v)}
            className="h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            title="Code snippet"
            data-testid="builder-codegen"
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            data-testid={BUILDER.saveButton}
            className="h-7 px-2.5 rounded-md text-[12px] font-medium border border-[hsl(var(--border))] hover:bg-accent/50 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save"}
          </button>
          <EnvPicker collectionId={collectionId} compact />
        </div>
      </div>

      <div className="p-3 border-b border-[hsl(var(--border))] flex items-center gap-2">
        <div className="flex flex-1 min-w-0 items-stretch rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--input))] overflow-hidden focus-within:ring-1 focus-within:ring-[hsl(var(--brand))]/35">
          <Select value={req.method} onValueChange={(v) => onChange({ ...req, method: v })}>
            <SelectTrigger
              className="w-[5.5rem] h-9 shrink-0 rounded-none border-0 border-r border-[hsl(var(--border))] bg-transparent text-[12px] font-mono font-semibold shadow-none focus:ring-0"
              data-testid={BUILDER.methodSelect}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
              {METHODS_LIST.map((m) => (
                <SelectItem key={m} value={m} className="font-mono">
                  <MethodBadge method={m} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <UrlInput
            value={req.url}
            onChange={(v) => onChange({ ...req, url: v })}
            onEnter={handleSend}
            onUpdateVariable={onUpdateVariable}
            env={activeEnv}
            placeholder="Enter request URL — use [[VAR]] for environment variables"
            testid={BUILDER.urlInput}
            grouped
          />
        </div>
        <button
          type="button"
          onClick={onAskAI}
          data-testid="builder-ask-ai"
          title="Open AI assistant to build this request"
          className="h-9 px-2.5 rounded-md bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand))]/25 text-[12px] font-medium inline-flex items-center gap-1.5 border border-[hsl(var(--brand))]/30"
        >
          <Sparkles className="h-3.5 w-3.5" /> Ask AI
        </button>
        <button
          onClick={handleSend}
          disabled={!canSend}
          data-testid={BUILDER.sendButton}
          title={urlEmpty ? "Enter a URL to send" : undefined}
          className="h-9 px-4 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? <Play className="h-3.5 w-3.5 animate-pulse" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? "Sending…" : "Send"}
        </button>
        {!responseOpen && onOpenResponse && (
          <button
            type="button"
            onClick={onOpenResponse}
            className="h-9 w-9 grid place-items-center rounded-md border border-[hsl(var(--border))] hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            title="Show response panel"
            data-testid="builder-show-response"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {showCodeGen && (
        <div className="m-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[hsl(var(--border))]">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Code snippet</div>
            <div className="flex gap-1">
              {CODE_LANGS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setCodeLang(l.id)}
                  className={cn(
                    "h-6 px-2 rounded text-[11px] font-mono",
                    codeLang === l.id ? "bg-accent" : "text-muted-foreground hover:bg-accent/50"
                  )}
                  data-testid={`codegen-${l.id}`}
                >
                  {l.label}
                </button>
              ))}
              <button
                onClick={() => { navigator.clipboard?.writeText(codeSnippet); toast.success("Copied"); }}
                className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:bg-accent/50"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <pre className="text-[12px] font-mono p-3 overflow-auto max-h-44 leading-relaxed">{codeSnippet}</pre>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 bg-transparent border-b border-[hsl(var(--border))] rounded-none h-9 px-2 justify-start gap-1 overflow-x-auto no-scrollbar">
          {[
            ["params", "Params", req.params?.length],
            ["authorization", "Authorization", null],
            ["headers", "Headers", req.headers?.length],
            ["body", "Body", req.body?.type !== "none" ? "•" : null],
            ["scripts", "Pre-request", null],
            ["tests", "Tests", null],
            ["docs", "Docs", req.docs ? "•" : null],
          ].map(([k, label, count]) => (
            <TabsTrigger
              key={k}
              value={k}
              data-testid={BUILDER.tab(k)}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-[hsl(var(--brand))] rounded-none h-9 px-3 text-[12.5px] text-muted-foreground"
            >
              {label}
              {count !== null && count !== undefined && (
                <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">{count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="params" className={cn(TAB_CONTENT_CLASS, "overflow-auto")}>
          <KvEditor
            rows={req.params || []}
            onChange={(rows) => onChange({ ...req, params: rows })}
            addLabel="Add param"
            testIdAdd={BUILDER.paramAdd}
          />
        </TabsContent>

        <TabsContent value="authorization" className={cn(TAB_CONTENT_CLASS, "overflow-auto p-3")}>
          <AuthEditor auth={req.auth || { type: "none" }} onChange={(auth) => onChange({ ...req, auth })} />
        </TabsContent>

        <TabsContent value="headers" className={cn(TAB_CONTENT_CLASS, "overflow-auto")}>
          <KvEditor
            rows={req.headers || []}
            onChange={(rows) => onChange({ ...req, headers: rows })}
            addLabel="Add header"
            testIdAdd={BUILDER.headerAdd}
          />
        </TabsContent>

        <TabsContent value="body" className={TAB_CONTENT_CLASS}>
          <div className="flex items-center gap-2 p-2 border-b border-[hsl(var(--border))]">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Type</span>
            <Select value={req.body.type} onValueChange={(v) => onChange({ ...req, body: { ...req.body, type: v } })}>
              <SelectTrigger className="h-7 w-36 bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[12px]" data-testid={BUILDER.bodyTypeSelect}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                {BODY_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-auto h-7 px-2 rounded text-[11px] border border-[hsl(var(--border))] hover:bg-accent/50">
                  Insert variable…
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
                {GENERATORS.map((g) => (
                  <DropdownMenuItem
                    key={g.id}
                    onClick={() => onChange({ ...req, body: { ...req.body, content: (req.body.content || "") + g.fn() } })}
                  >
                    {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {req.body.type === "form" ? (
            <KvEditor
              rows={Array.isArray(req.body.formRows) ? req.body.formRows : [{ key: "", value: "", enabled: true }]}
              onChange={(rows) => onChange({ ...req, body: { ...req.body, formRows: rows } })}
              addLabel="Add field"
            />
          ) : req.body.type === "none" ? (
            <div className="flex-1 grid place-items-center text-center p-6 text-muted-foreground text-[12.5px]">
              This request does not have a body.
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                defaultLanguage={BODY_TYPES.find((b) => b.id === req.body.type)?.lang || "json"}
                language={BODY_TYPES.find((b) => b.id === req.body.type)?.lang || "json"}
                value={req.body.content || ""}
                onChange={(v) => onChange({ ...req, body: { ...req.body, content: v || "" } })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false }, fontSize: 13,
                  fontFamily: "JetBrains Mono, monospace",
                  scrollBeyondLastLine: false, padding: { top: 12 }, lineNumbers: "on",
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="scripts" className={TAB_CONTENT_CLASS}>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language="javascript"
              value={req.preScript || ""}
              onChange={(v) => onChange({ ...req, preScript: v || "" })}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace", padding: { top: 8 }, scrollBeyondLastLine: false, lineNumbers: "on" }}
            />
          </div>
        </TabsContent>

        <TabsContent value="tests" className={TAB_CONTENT_CLASS}>
          <TestsPanel
            tests={req.tests}
            onChange={(v) => onChange({ ...req, tests: v })}
            results={testResults}
          />
        </TabsContent>

        <TabsContent value="docs" className={TAB_CONTENT_CLASS}>
          <DocsPanel
            value={req.docs || ""}
            onChange={(v) => onChange({ ...req, docs: v })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
