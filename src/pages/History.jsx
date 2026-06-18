import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "@/components/shared/MethodBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Search, Star, Trash2, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-auth";
import {
  useClearHistory,
  useDeleteHistoryEntry,
  useHistory,
  useToggleHistoryFavorite,
} from "@/hooks/use-history";

const METHODS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"];
const STATUSES = [
  { id: "ALL", label: "All" },
  { id: "2xx", label: "2xx" },
  { id: "4xx", label: "4xx" },
  { id: "5xx", label: "5xx" },
];

export default function History() {
  const user = useAppStore((s) => s.user);
  const history = useAppStore((s) => s.history);
  const { isLoading } = useHistory();
  const toggleFavorite = useToggleHistoryFavorite();
  const deleteEntry = useDeleteHistoryEntry();
  const clearHistory = useClearHistory();
  const [q, setQ] = useState("");
  const [m, setM] = useState("ALL");
  const [s, setS] = useState("ALL");
  const [favOnly, setFavOnly] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = history.filter((h) => {
    if (favOnly && !h.favorite) return false;
    if (m !== "ALL" && h.method !== m) return false;
    if (s !== "ALL") {
      if (s === "2xx" && !(h.status >= 200 && h.status < 300)) return false;
      if (s === "4xx" && !(h.status >= 400 && h.status < 500)) return false;
      if (s === "5xx" && !(h.status >= 500)) return false;
    }
    const haystack = `${h.method} ${h.url} ${h.requestName || ""} ${h.userName || ""}`.toLowerCase();
    if (q && !haystack.includes(q.toLowerCase())) return false;
    return true;
  });

  const canModify = (entry) => !user?.id || entry.userId === user.id;

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="border-b border-border p-4 flex items-center gap-2 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-mono">// timeline</div>
          <h1 className="text-2xl font-medium tracking-tight">History</h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Workspace request log — synced per team, attributed to each member.
          </p>
        </div>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search history…"
            className="h-9 w-72 pl-8 pr-2 rounded-md bg-muted border border-border text-[13px]"
          />
        </div>
        <div className="flex items-center gap-1">
          {METHODS.map((opt) => (
            <button
              key={opt}
              onClick={() => setM(opt)}
              className={cn("h-7 px-2 rounded text-[11px] font-mono uppercase tracking-wider border", m === opt ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/15 text-foreground" : "border-border text-muted-foreground hover:bg-accent/50")}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {STATUSES.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setS(opt.id)}
              className={cn("h-7 px-2 rounded text-[11px] font-mono uppercase tracking-wider border", s === opt.id ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))]/15 text-foreground" : "border-border text-muted-foreground hover:bg-accent/50")}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => setFavOnly((v) => !v)} className={cn("h-7 px-2 rounded text-[11px] border inline-flex items-center gap-1", favOnly ? "border-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "border-border text-muted-foreground hover:bg-accent/50")}>
          <Star className="h-3 w-3" /> Favorites
        </button>
        <button onClick={() => setConfirmClear(true)} className="h-7 px-2 rounded text-[11px] border border-border text-muted-foreground hover:bg-accent/50">
          Clear mine
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && history.length === 0 ? (
          <div className="grid place-items-center h-full text-[13px] text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading history…
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center h-full text-[13px] text-muted-foreground">No history matches your filters</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((h) => (
              <div key={h.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50">
                <MethodBadge method={h.method} className="w-14" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-mono truncate">{h.requestName || h.url}</div>
                  {h.requestName && (
                    <div className="text-[11px] text-muted-foreground font-mono truncate">{h.url}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono uppercase tracking-wider">
                    {h.collectionName} • {h.userName || "Unknown"} • {new Date(h.timestamp).toLocaleString()} • {h.durationMs}ms • {(h.sizeBytes / 1024).toFixed(1)} KB
                  </div>
                </div>
                <StatusBadge status={h.status} />
                {canModify(h) && (
                  <button
                    onClick={() => toggleFavorite.mutate(h.id, {
                      onError: (err) => toast.error(getErrorMessage(err, "Could not update favorite.")),
                    })}
                    className={cn("h-7 w-7 grid place-items-center rounded hover:bg-accent/50", h.favorite ? "text-[hsl(var(--warning))]" : "text-muted-foreground")}
                  >
                    <Star className={cn("h-3.5 w-3.5", h.favorite && "fill-[hsl(var(--warning))]")} />
                  </button>
                )}
                <button className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground" title="Re-run (coming soon)">
                  <Play className="h-3.5 w-3.5" />
                </button>
                {canModify(h) && (
                  <button
                    onClick={() => setDeleteTarget(h)}
                    className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete history entry"
        description={deleteTarget ? `Remove "${deleteTarget.requestName || deleteTarget.url}" from history?` : ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEntry.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (err) => toast.error(getErrorMessage(err, "Could not delete entry.")),
          });
        }}
      />
      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear your history"
        description="Remove all history entries you sent in this workspace? This cannot be undone."
        confirmLabel="Clear mine"
        onConfirm={() => {
          clearHistory.mutate(undefined, {
            onSuccess: () => setConfirmClear(false),
            onError: (err) => toast.error(getErrorMessage(err, "Could not clear history.")),
          });
        }}
      />
    </div>
  );
}
