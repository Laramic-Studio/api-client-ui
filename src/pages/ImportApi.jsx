import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Check, FileJson, Loader2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/hooks/use-auth";
import { useActiveTeamId, useCollections } from "@/hooks/use-collections";
import { useImportCollection } from "@/hooks/use-import";
import {
  IMPORT_FORMATS,
  countImportRequests,
  flattenImportPreview,
  parseImportContent,
} from "@/lib/import";

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
  info: {
    name: "Sample Postman",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: [
    { name: "List users", request: { method: "GET", url: { raw: "{{BASE_URL}}/users" }, header: [] } },
    {
      name: "Create user",
      request: {
        method: "POST",
        url: { raw: "{{BASE_URL}}/users" },
        header: [{ key: "Content-Type", value: "application/json" }],
        body: { mode: "raw", raw: "{\"name\":\"Ada\"}" },
      },
    },
  ],
}, null, 2);

const SAMPLE_INSOMNIA = JSON.stringify({
  _type: "export",
  __export_format: 4,
  resources: [
    { _id: "wrk_1", _type: "Workspace", name: "Sample Insomnia" },
    { _id: "req_1", _type: "request", parentId: "wrk_1", name: "List users", method: "GET", url: "{{ base_url }}/users" },
    {
      _id: "req_2",
      _type: "request",
      parentId: "wrk_1",
      name: "Create user",
      method: "POST",
      url: "{{ base_url }}/users",
      body: { mimeType: "application/json", text: "{\"name\":\"Ada\"}" },
    },
  ],
}, null, 2);

const SAMPLE_HOPPSCOTCH = JSON.stringify({
  name: "Sample Hoppscotch",
  v: 9,
  folders: [
    {
      name: "Users",
      folders: [],
      requests: ["req_list"],
    },
  ],
  requests: [
    {
      id: "req_list",
      name: "List users",
      method: "GET",
      endpoint: "<<BASE_URL>>/users",
      headers: [{ key: "Accept", value: "application/json", active: true }],
      params: [],
      body: { contentType: "", body: null },
      auth: { authType: "none" },
    },
    {
      id: "req_create",
      name: "Create user",
      method: "POST",
      endpoint: "<<BASE_URL>>/users",
      headers: [{ key: "Content-Type", value: "application/json", active: true }],
      params: [],
      body: { contentType: "application/json", body: "{\"name\":\"Ada\"}" },
      auth: { authType: "none" },
    },
  ],
}, null, 2);

const FORMAT_SAMPLES = {
  openapi: SAMPLE_OPENAPI,
  postman: SAMPLE_POSTMAN,
  hoppscotch: SAMPLE_HOPPSCOTCH,
  insomnia: SAMPLE_INSOMNIA,
  har: "",
};

const FORMAT_LABELS = {
  openapi: "OpenAPI",
  postman: "Postman",
  hoppscotch: "Hoppscotch",
  insomnia: "Insomnia",
  har: "HAR",
};

export default function ImportApi() {
  const navigate = useNavigate();
  const teamId = useActiveTeamId();
  useCollections();

  const [format, setFormat] = useState("openapi");
  const [mode, setMode] = useState("paste");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState(SAMPLE_OPENAPI);
  const [parsed, setParsed] = useState(null);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const importCollection = useImportCollection();

  const preview = useMemo(
    () => (parsed?.kind === "collection" ? flattenImportPreview(parsed.collection) : []),
    [parsed],
  );

  const requestCount = parsed?.kind === "collection"
    ? countImportRequests(parsed.collection)
    : 0;

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setContent(text);
    setMode("paste");
    setParsed(null);
    toast.success(`Loaded ${file.name}`);
  };

  const loadFromUrl = async () => {
    const target = url.trim();
    if (!target) {
      toast.error("Enter an OpenAPI URL.");
      return;
    }

    setFetchingUrl(true);
    try {
      const response = await fetch(target);
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
      const text = await response.text();
      setContent(text);
      setMode("paste");
      setParsed(null);
      toast.success("OpenAPI spec fetched");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not fetch OpenAPI URL. Try pasting the file instead."));
    } finally {
      setFetchingUrl(false);
    }
  };

  const onParse = () => {
    const result = parseImportContent(content, { formatHint: format });
    if (result.kind === "error") {
      setParsed(null);
      toast.error(result.message);
      return;
    }
    setParsed(result);
    toast.success(`Parsed ${countImportRequests(result.collection)} requests`);
  };

  const onImport = () => {
    if (!teamId) {
      toast.error("Select a workspace before importing.");
      return;
    }
    if (parsed?.kind !== "collection") return;

    importCollection.mutate(parsed.collection, {
      onSuccess: (result) => {
        toast.success(`Imported ${result.requestCount} requests into "${result.collectionName}"`);
        navigate("/builder");
      },
      onError: (err) => toast.error(getErrorMessage(err, "Import failed.")),
    });
  };

  if (!teamId) {
    return (
      <div className="h-full grid place-items-center text-[13px] text-muted-foreground">
        Select a workspace to import an API collection.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// onboarding</div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Import API</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          From OpenAPI, Postman, Hoppscotch, Insomnia, or HAR — creates a cloud collection you can use in the builder.
        </p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="flex items-center border-b border-border overflow-x-auto">
          {IMPORT_FORMATS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFormat(item.id);
                setContent(FORMAT_SAMPLES[item.id] || "");
                setParsed(null);
              }}
              className={cn(
                "h-10 px-4 inline-flex items-center gap-2 text-[12.5px] border-b-2 whitespace-nowrap",
                format === item.id
                  ? "border-[hsl(var(--brand))] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              data-testid={`import-format-${item.id}`}
            >
              <FileJson className="h-3.5 w-3.5" /> {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-[12px] flex-wrap">
            <button
              onClick={() => setMode("paste")}
              className={cn(
                "h-7 px-2 rounded border",
                mode === "paste"
                  ? "border-[hsl(var(--brand))] text-foreground bg-[hsl(var(--brand))]/10"
                  : "border-border text-muted-foreground",
              )}
              data-testid="import-mode-paste"
            >
              Paste
            </button>
            <button
              onClick={() => setMode("url")}
              className={cn(
                "h-7 px-2 rounded border",
                mode === "url"
                  ? "border-[hsl(var(--brand))] text-foreground bg-[hsl(var(--brand))]/10"
                  : "border-border text-muted-foreground",
              )}
              data-testid="import-mode-url"
              disabled={format !== "openapi"}
              title={format !== "openapi" ? "URL fetch is only supported for OpenAPI" : ""}
            >
              URL
            </button>
            <label className="h-7 px-2 rounded border border-border text-muted-foreground hover:bg-accent/40 cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="h-3 w-3" /> File…
              <input
                type="file"
                accept=".json,.yaml,.yml,.har,.txt"
                onChange={onFile}
                className="hidden"
                data-testid="import-file-input"
              />
            </label>
          </div>

          {mode === "url" ? (
            <div className="flex items-center gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="import-url-input"
                placeholder="https://petstore3.swagger.io/api/v3/openapi.json"
                className="flex-1 h-10 px-3 rounded-md bg-muted border border-border text-[13px] font-geom"
              />
              <button
                onClick={loadFromUrl}
                disabled={fetchingUrl}
                className="h-10 px-3 rounded-md border border-border hover:bg-accent/40 text-[13px] inline-flex items-center gap-2 disabled:opacity-60"
              >
                {fetchingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                Fetch
              </button>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setParsed(null);
              }}
              data-testid="import-paste-area"
              className="w-full min-h-[240px] p-3 rounded-md bg-muted border border-border text-[12.5px] font-geom"
            />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onParse}
              data-testid="import-parse"
              className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white text-[13px] font-medium inline-flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5" /> Parse preview
            </button>
            {parsed?.kind === "collection" && (
              <button
                onClick={onImport}
                disabled={importCollection.isPending}
                data-testid="import-create"
                className="h-9 px-3 rounded-md border border-border hover:bg-accent/40 text-[13px] inline-flex items-center gap-2 disabled:opacity-60"
              >
                {importCollection.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
                )}
                Import {requestCount} requests
              </button>
            )}
          </div>

          {parsed?.kind === "collection" && (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
              Collection <span className="text-foreground font-medium">{parsed.collection.name}</span>
              {" · "}
              {FORMAT_LABELS[parsed.format] || parsed.format}
              {" · "}
              {requestCount} requests
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-1 rounded-md border border-border max-h-72 overflow-auto">
              {preview.map((row, index) => (
                <div
                  key={`${row.method}-${row.url}-${index}`}
                  className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-b-0 text-[12.5px]"
                >
                  <span className="font-geom font-semibold w-16 text-[hsl(var(--brand))]">{row.method}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{row.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground font-geom">{row.url}</div>
                    {row.folderLabel && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{row.folderLabel}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
