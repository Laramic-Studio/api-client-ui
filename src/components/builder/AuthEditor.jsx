import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const SELECTABLE_AUTH_TYPES = ["none", "bearer", "basic", "apikey"];

export default function AuthEditor({ auth, onChange }) {
  const isLegacyOAuth = auth.type === "oauth2";

  return (
    <div className="space-y-3 max-w-xl">
      {isLegacyOAuth ? (
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Type</div>
          <div className="rounded-md border border-[hsl(var(--border))] bg-muted/40 px-3 py-2.5 text-[12.5px] text-foreground/90 leading-relaxed">
            OAuth 2.0 is coming soon — use <span className="font-medium">Bearer Token</span> with an access token for now.
          </div>
        </>
      ) : (
        <>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Type</div>
          <Select value={auth.type} onValueChange={(v) => onChange({ ...auth, type: v })}>
            <SelectTrigger className="h-9 w-56 bg-[hsl(var(--input))] border-[hsl(var(--border))] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--popover))] border-[hsl(var(--border))]">
              {SELECTABLE_AUTH_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{label(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {auth.type === "bearer" && (
        <Field label="Token" value={auth.token || ""} onChange={(v) => onChange({ ...auth, token: v })} placeholder="[[TOKEN]] or paste token" />
      )}
      {auth.type === "basic" && (
        <>
          <Field label="Username" value={auth.username || ""} onChange={(v) => onChange({ ...auth, username: v })} />
          <Field label="Password" value={auth.password || ""} onChange={(v) => onChange({ ...auth, password: v })} type="password" />
        </>
      )}
      {auth.type === "apikey" && (
        <>
          <Field label="Header name" value={auth.headerName || "X-API-Key"} onChange={(v) => onChange({ ...auth, headerName: v })} />
          <Field label="Value" value={auth.value || ""} onChange={(v) => onChange({ ...auth, value: v })} />
        </>
      )}
      {auth.type === "none" && !isLegacyOAuth && (
        <div className="text-[12px] text-muted-foreground">No auth headers will be sent.</div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-2.5 rounded-md bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[13px] font-mono ring-focus"
      />
    </div>
  );
}

function label(t) {
  return { none: "No Auth", bearer: "Bearer Token", basic: "Basic Auth", apikey: "API Key" }[t];
}
