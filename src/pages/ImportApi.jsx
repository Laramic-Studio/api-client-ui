// Import collections from OpenAPI/Swagger, Postman v2.1, Insomnia v4, HAR.
import { useState } from "react";
import { Upload, FileText, Link as LinkIcon, Check, FileJson } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const SAMPLE_OPENAPI = `openapi: 3.0.0
info: { title: Sample API, version: 1.0.0 }
paths:
  /users:
    get: { summary: List users }
    post: { summary: Create user }
  /users/{id}:
    get: { summary: Get user by id }
    delete: { summary: Delete user }
  /orders:
    post: { summary: Create order }
`;

const SAMPLE_POSTMAN = JSON.stringify({
  info: { name: "Sample Postman", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  item: [
    { name: "List users", request: { method: "GET", url: { raw: "{{BASE_URL}}/users" }, header: [] } },
    { name: "Create user", request: { method: "POST", url: { raw: "{{BASE_URL}}/users" }, header: [{ key: "Content-Type", value: "application/json" }], body: { mode: "raw", raw: "{\"name\":\"Ada\"}" } } },
  ],
}, null, 2);

const SAMPLE_INSOMNIA = JSON.stringify({
  _type: "export",
  __export_format: 4,
  resources: [
    { _id: "req_1", _type: "request", parentId: "wrk_1", name: "List users", method: "GET", url: "{{ base_url }}/users" },
    { _id: "req_2", _type: "request", parentId: "wrk_1", name: "Create user", method: "POST", url: "{{ base_url }}/users", body: { mimeType: "application/json", text: "{\"name\":\"Ada\"}" } },
  ],
}, null, 2);

const FORMATS = [
  { id: "openapi", label: "OpenAPI / YAML", sample: SAMPLE_OPENAPI },
  { id: "postman", label: "Postman v2.1", sample: SAMPLE_POSTMAN },
  { id: "insomnia", label: "Insomnia v4", sample: SAMPLE_INSOMNIA },
  { id: "har", label: "HAR (browser export)", sample: "" },
];

function parseOpenAPI(text) {
  const reqs = []; let currentPath = null;
  for (const raw of text.split("\n")) {
    const l = raw.replace(/#.*$/, "");
    const pathMatch = l.match(/^\s*(\/\S*):/);
    if (pathMatch) currentPath = pathMatch[1];
    const methMatch = l.match(/^\s{2,}(get|post|put|patch|delete|options|head):/i);
    if (methMatch && currentPath) reqs.push({ method: methMatch[1].toUpperCase(), path: currentPath, name: `${methMatch[1].toUpperCase()} ${currentPath}` });
  }
  return reqs;
}
function parsePostman(text) {
  const j = JSON.parse(text);
  const out = [];
  const walk = (items) => {
    for (const it of items || []) {
      if (it.item) { walk(it.item); continue; }
      const r = it.request || {};
      const url = typeof r.url === "string" ? r.url : (r.url?.raw || "");
      out.push({
        method: (r.method || "GET").toUpperCase(),
        path: url.replace(/^https?:\/\/[^/]+/, "").replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/gi, "[[$1]]"),
        name: it.name || `${r.method} ${url}`,
        headers: (r.header || []).map((h) => ({ key: h.key, value: h.value, enabled: !h.disabled })),
        body: r.body?.mode === "raw" ? { type: "json", content: r.body.raw } : { type: "none", content: "" },
      });
    }
  };
  walk(j.item || []);
  return out;
}
function parseInsomnia(text) {
  const j = JSON.parse(text);
  return (j.resources || []).filter((r) => r._type === "request").map((r) => ({
    method: (r.method || "GET").toUpperCase(),
    path: (r.url || "").replace(/\{\{\s*([a-zA-Z0-9_ ]+)\s*\}\}/g, (_m, k) => `[[${k.trim().toUpperCase()}]]`),
    name: r.name || `${r.method} ${r.url}`,
    headers: (r.headers || []).map((h) => ({ key: h.name, value: h.value, enabled: !h.disabled })),
    body: r.body?.text ? { type: "json", content: r.body.text } : { type: "none", content: "" },
  }));
}
function parseHAR(text) {
  const j = JSON.parse(text);
  return ((j.log?.entries) || []).map((e) => {
    const u = new URL(e.request.url);
    return {
      method: e.request.method,
      path: u.pathname + (u.search || ""),
      name: `${e.request.method} ${u.pathname}`,
      headers: (e.request.headers || []).map((h) => ({ key: h.name, value: h.value, enabled: true })),
      body: e.request.postData?.text ? { type: "json", content: e.request.postData.text } : { type: "none", content: "" },
    };
  });
}

export default function ImportApi() {
  const [format, setFormat] = useState("openapi");
  const [mode, setMode] = useState("paste"); // paste | url
  const [url, setUrl] = useState("");
  const [content, setContent] = useState(SAMPLE_OPENAPI);
  const [imported, setImported] = useState(null);
  const createCollection = useAppStore((s) => s.createCollection);
  const addRequest = useAppStore((s) => s.addRequest);
  const navigate = useNavigate();

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setContent(text);
    setMode("paste");
    toast.success(`Loaded ${f.name}`);
  };

  const parse = () => {
    let text = content;
    try {
      const parsers = { openapi: parseOpenAPI, postman: parsePostman, insomnia: parseInsomnia, har: parseHAR };
      const reqs = parsers[format](text);
      if (!reqs.length) return toast.error("No requests found");
      setImported(reqs);
      toast.success(`Parsed ${reqs.length} requests`);
    } catch (e) {
      toast.error(`Parse failed: ${e.message}`);
    }
  };

  const importNow = () => {
    if (!imported) return;
    const labels = { openapi: "OpenAPI", postman: "Postman", insomnia: "Insomnia", har: "HAR" };
    const col = createCollection(`Imported · ${labels[format]} · ${new Date().toLocaleTimeString()}`);
    imported.forEach((r) => {
      addRequest(col.id, {
        name: r.name,
        method: r.method,
        url: r.path?.startsWith("http") ? r.path : `[[BASE_URL]]${r.path || "/"}`,
        headers: r.headers || [{ key: "Accept", value: "application/json", enabled: true }],
        body: r.body || { type: "none", content: "" },
      });
    });
    toast.success(`Created collection with ${imported.length} requests`);
    navigate("/collections");
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// onboarding</div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Import API</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">From OpenAPI, Postman, Insomnia, or HAR — generates a new collection.</p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center border-b border-border overflow-x-auto">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFormat(f.id); setContent(f.sample); setImported(null); }}
              className={cn(
                "h-10 px-4 inline-flex items-center gap-2 text-[12.5px] border-b-2 whitespace-nowrap",
                format === f.id ? "border-[hsl(var(--brand))] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              data-testid={`import-format-${f.id}`}
            >
              <FileJson className="h-3.5 w-3.5" /> {f.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-[12px]">
            <button
              onClick={() => setMode("paste")}
              className={cn("h-7 px-2 rounded border", mode === "paste" ? "border-[hsl(var(--brand))] text-foreground bg-[hsl(var(--brand))]/10" : "border-border text-muted-foreground")}
              data-testid="import-mode-paste"
            >Paste</button>
            <button
              onClick={() => setMode("url")}
              className={cn("h-7 px-2 rounded border", mode === "url" ? "border-[hsl(var(--brand))] text-foreground bg-[hsl(var(--brand))]/10" : "border-border text-muted-foreground")}
              data-testid="import-mode-url"
              disabled={format !== "openapi"}
              title={format !== "openapi" ? "URL fetch is only supported for OpenAPI in this prototype" : ""}
            >URL</button>
            <label className="h-7 px-2 rounded border border-border text-muted-foreground hover:bg-accent/40 cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="h-3 w-3" /> File…
              <input type="file" accept=".json,.yaml,.yml,.har,.txt" onChange={onFile} className="hidden" data-testid="import-file-input" />
            </label>
          </div>

          {mode === "url" ? (
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="import-url-input"
              placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
              className="w-full h-10 px-3 rounded-md bg-muted border border-border text-[13px] font-mono"
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              data-testid="import-paste-area"
              className="w-full min-h-[240px] p-3 rounded-md bg-muted border border-border text-[12.5px] font-mono"
            />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={parse}
              data-testid="import-parse"
              className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white text-[13px] font-medium inline-flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5" /> Parse
            </button>
            {imported && (
              <button
                onClick={importNow}
                data-testid="import-create"
                className="h-9 px-3 rounded-md border border-border hover:bg-accent/40 text-[13px] inline-flex items-center gap-2"
              >
                <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" /> Import {imported.length} requests
              </button>
            )}
          </div>

          {imported && (
            <div className="mt-3 rounded-md border border-border max-h-72 overflow-auto">
              {imported.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-b-0 text-[12.5px]">
                  <span className="font-mono font-semibold w-16 text-[hsl(var(--brand))]">{r.method}</span>
                  <span className="font-mono truncate">{r.path || r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
