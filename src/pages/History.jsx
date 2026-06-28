import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "@/components/shared/MethodBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, Trash2, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/hooks/use-auth";
import { useCollections } from "@/hooks/use-collections";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { replayHistoryEntry } from "@/lib/builder/history";
import { hasActiveHistoryFilters } from "@/lib/api/map-history";
import {
  useClearHistory,
  useDeleteHistoryEntry,
  useHistory,
  useToggleHistoryFavorite,
  useActiveTeamId,
} from "@/hooks/use-history";
import ReadOnlyWorkspaceBanner from "@/components/shared/ReadOnlyWorkspaceBanner";
import { useWorkspaceWriteAccess } from "@/hooks/use-team-permissions";

const METHODS = [
  { id: "ALL", label: "All methods" },
  { id: "GET", label: "GET" },
  { id: "POST", label: "POST" },
  { id: "PUT", label: "PUT" },
  { id: "PATCH", label: "PATCH" },
  { id: "DELETE", label: "DELETE" },
];
const STATUSES = [
  { id: "ALL", label: "All statuses" },
  { id: "2xx", label: "2xx Success" },
  { id: "4xx", label: "4xx Client error" },
  { id: "5xx", label: "5xx Server error" },
];

export default function History() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const teamId = useActiveTeamId();
  useCollections();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    method: "ALL",
    status: "ALL",
    favorite: false,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const debouncedSearch = useDebouncedCallback((value) => {
    setFilters((current) => ({ ...current, q: value }));
  }, 400);

  const { data: history = [], isLoading, isError, refetch, isFetching } = useHistory(filters);
  const toggleFavorite = useToggleHistoryFavorite();
  const deleteEntry = useDeleteHistoryEntry();
  const clearHistory = useClearHistory();
  const { isReadOnly, notifyReadOnly } = useWorkspaceWriteAccess();

  const filtersActive = useMemo(() => hasActiveHistoryFilters(filters), [filters]);
  const searchPending = searchInput.trim() !== filters.q.trim();

  const setMethod = useCallback((method) => {
    setFilters((current) => ({ ...current, method }));
  }, []);

  const setStatus = useCallback((status) => {
    setFilters((current) => ({ ...current, status }));
  }, []);

  const toggleFavoritesOnly = useCallback(() => {
    setFilters((current) => ({ ...current, favorite: !current.favorite }));
  }, []);

  const canModify = (entry) => !isReadOnly && (!user?.id || String(entry.userId) === String(user.id));

  const handleReplay = (entry) => {
    const { path } = replayHistoryEntry(entry);
    navigate(path);
  };

  if (!teamId) {
    return (
      <div className="h-full grid place-items-center text-[13px] text-muted-foreground">
        Select a workspace to view request history.
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="border-b border-border p-4 space-y-3">
        <ReadOnlyWorkspaceBanner compact />
        <div className="flex items-center gap-2 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// timeline</div>
          <h1 className="text-2xl font-medium tracking-tight">History</h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            Workspace request log — synced per team, attributed to each member.
          </p>
        </div>
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearch(e.target.value);
            }}
            placeholder="Search history…"
            className="h-9 w-72 pl-8 pr-2 rounded-md bg-muted border border-border text-[13px]"
          />
        </div>
        <Select value={filters.method} onValueChange={setMethod}>
          <SelectTrigger className="h-7 w-[132px] text-[11px] font-geom uppercase tracking-wider border-border bg-transparent">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id} className="text-[12px] font-geom">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={setStatus}>
          <SelectTrigger className="h-7 w-[148px] text-[11px] font-geom uppercase tracking-wider border-border bg-transparent">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((opt) => (
              <SelectItem key={opt.id} value={opt.id} className="text-[12px]">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={toggleFavoritesOnly}
          className={cn(
            "h-7 px-2 rounded text-[11px] border inline-flex items-center gap-1",
            filters.favorite
              ? "border-[hsl(var(--warning))] text-[hsl(var(--warning))]"
              : "border-border text-muted-foreground hover:bg-accent/50",
          )}
        >
          <Star className="h-3 w-3" /> Favorites
        </button>
        <button
          onClick={() => {
            if (isReadOnly) {
              notifyReadOnly();
              return;
            }
            setConfirmClear(true);
          }}
          disabled={isReadOnly}
          className="h-7 px-2 rounded text-[11px] border border-border text-muted-foreground hover:bg-accent/50 disabled:opacity-50"
        >
          Clear mine
        </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {(isLoading || searchPending) && history.length === 0 ? (
          <div className="grid place-items-center h-full text-[13px] text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading history…
          </div>
        ) : isError ? (
          <div className="grid place-items-center h-full text-[13px] text-muted-foreground gap-3">
            <p>Could not load history.</p>
            <button
              onClick={() => refetch()}
              className="h-8 px-3 rounded text-[12px] border border-border hover:bg-accent/50"
            >
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="grid place-items-center h-full text-[13px] text-muted-foreground">
            {filtersActive
              ? "No history matches your filters"
              : "No requests logged yet — send a request from the API Builder to get started."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((h) => (
              <div
                key={h.id}
                className={cn(
                  "px-4 py-2.5 flex items-center gap-3 hover:bg-accent/50",
                  h.favorite && "bg-[hsl(var(--warning))]/5",
                )}
              >
                <MethodBadge method={h.method} className="w-14" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-geom truncate flex items-center gap-1.5">
                    {h.favorite && (
                      <Star className="h-3 w-3 shrink-0 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                    )}
                    <span className="truncate">{h.requestName || h.url}</span>
                  </div>
                  {h.requestName && (
                    <div className="text-[11px] text-muted-foreground font-geom truncate">{h.url}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-0.5 font-geom uppercase tracking-wider">
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
                    title={h.favorite ? "Remove from favorites" : "Star entry"}
                  >
                    <Star className={cn("h-3.5 w-3.5", h.favorite && "fill-[hsl(var(--warning))]")} />
                  </button>
                )}
                <button
                  onClick={() => handleReplay(h)}
                  className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  title="Re-run in API Builder"
                >
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
        {(isFetching || searchPending) && history.length > 0 && (
          <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-2 text-[11px] text-muted-foreground font-geom inline-flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Syncing…
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
