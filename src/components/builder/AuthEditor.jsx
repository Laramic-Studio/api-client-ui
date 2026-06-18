import { useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { fetchOAuthAccessToken, normalizeOAuthAuth, oauthStatusLabel } from "@/lib/builder/oauth";
import { toast } from "sonner";

const SELECTABLE_AUTH_TYPES = ["none", "bearer", "basic", "apikey", "oauth2"];

export default function AuthEditor({ auth, onChange, activeEnv = null }) {
  const normalized = normalizeOAuthAuth(auth);
  const isOAuth = normalized.type === "oauth2";
  const [fetchingToken, setFetchingToken] = useState(false);

  const updateAuth = (patch) => onChange({ ...normalized, ...patch, type: normalized.type });

  const handleFetchToken = async () => {
    setFetchingToken(true);
    try {
      const next = await fetchOAuthAccessToken(normalized, activeEnv);
      onChange(next);
      toast.success("OAuth token acquired.");
    } catch (err) {
      toast.error(err?.message || "Could not fetch OAuth token.");
    } finally {
      setFetchingToken(false);
    }
  };

  return (
    <div className="space-y-3 max-w-xl">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Type</div>
      <Select
        value={normalized.type}
        onValueChange={(v) => {
          if (v === "oauth2") {
            onChange(normalizeOAuthAuth({ type: "oauth2" }));
            return;
          }
          onChange({ type: v });
        }}
      >
        <SelectTrigger className="h-9 w-56 bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[13px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
          {SELECTABLE_AUTH_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{label(t)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {normalized.type === "bearer" && (
        <Field label="Token" value={normalized.token || ""} onChange={(v) => updateAuth({ token: v })} placeholder="[[TOKEN]] or paste token" />
      )}
      {normalized.type === "basic" && (
        <>
          <Field label="Username" value={normalized.username || ""} onChange={(v) => updateAuth({ username: v })} />
          <Field label="Password" value={normalized.password || ""} onChange={(v) => updateAuth({ password: v })} type="password" />
        </>
      )}
      {normalized.type === "apikey" && (
        <>
          <Field label="Header name" value={normalized.headerName || "X-API-Key"} onChange={(v) => updateAuth({ headerName: v })} />
          <Field label="Value" value={normalized.value || ""} onChange={(v) => updateAuth({ value: v })} />
        </>
      )}
      {isOAuth && (
        <>
          <Field label="Grant type" value={normalized.grantType || "client_credentials"} readOnly />
          <Field label="Token URL" value={normalized.tokenUrl || ""} onChange={(v) => updateAuth({ tokenUrl: v })} placeholder="https://auth.example.com/oauth/token" />
          <Field label="Client ID" value={normalized.clientId || ""} onChange={(v) => updateAuth({ clientId: v })} placeholder="[[CLIENT_ID]]" />
          <Field label="Client Secret" value={normalized.clientSecret || ""} onChange={(v) => updateAuth({ clientSecret: v })} type="password" placeholder="[[CLIENT_SECRET]]" />
          <Field label="Scope" value={normalized.scope || ""} onChange={(v) => updateAuth({ scope: v })} placeholder="read write" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFetchToken}
              disabled={fetchingToken}
              className="h-8 px-3 rounded-md text-[12px] font-medium border border-[hsl(var(--border))] hover:bg-accent/50 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {fetchingToken ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {fetchingToken ? "Fetching…" : "Get token"}
            </button>
            <span className="text-[11.5px] text-muted-foreground">{oauthStatusLabel(normalized)}</span>
          </div>
          <div className="text-[11.5px] text-muted-foreground leading-relaxed">
            Client secret is exchanged server-side. Tokens refresh automatically before send when expired.
          </div>
        </>
      )}
      {normalized.type === "none" && (
        <div className="text-[12px] text-muted-foreground">No auth headers will be sent.</div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, readOnly = false }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-2.5 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[13px] font-mono ring-focus read-only:opacity-70"
      />
    </div>
  );
}

function label(t) {
  return {
    none: "No Auth",
    bearer: "Bearer Token",
    basic: "Basic Auth",
    apikey: "API Key",
    oauth2: "OAuth 2.0",
  }[t];
}
