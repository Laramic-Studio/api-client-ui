// Open-request tab bar (VSCode-style) with reorder via drag-and-drop.
import { X, Plus } from "lucide-react";
import MethodBadge from "@/components/shared/MethodBadge";
import { useAppStore } from "@/store/useAppStore";
import { isScratchTab } from "@/lib/builder/scratch";
import { isTabDirty } from "@/lib/builder/dirty";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function RequestTabs({ onNewScratch, onTabSelect, onTabClose, drafts = {}, trailing = null }) {
  const tabs = useAppStore((s) => s.openTabs);
  const active = useAppStore((s) => s.activeTabId);
  const setActive = useAppStore((s) => s.setActiveTab);
  const reorder = useAppStore((s) => s.reorderTabs);
  const findRequest = useAppStore((s) => s.findRequest);
  const [dragId, setDragId] = useState(null);

  const handleClose = (e, tabId) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  const handleSelect = (tabId) => {
    setActive(tabId);
    onTabSelect?.(tabId);
  };

  return (
    <div className="h-9 shrink-0 flex items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex h-full flex-1 min-w-0 items-center overflow-hidden">
        <div className="flex h-full overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const req = t.scratch || isScratchTab(t.id) ? null : findRequest(t.id).request;
          const method = req?.method || "GET";
          const label = req?.name || t.label || "Untitled";
          const dirty = isTabDirty(t.id, drafts[t.id], req);
          return (
            <div
              key={t.id}
              draggable
              onDragStart={() => setDragId(t.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId && dragId !== t.id) reorder(dragId, t.id); setDragId(null); }}
              onClick={() => handleSelect(t.id)}
              className={cn(
                "group h-full flex items-center gap-2 px-3 border-r border-[hsl(var(--border))] text-[12.5px] cursor-pointer min-w-0 max-w-[220px]",
                active === t.id
                  ? "bg-[hsl(var(--background))] text-foreground border-t-2 border-t-[hsl(var(--brand))]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              data-testid={`tab-${t.id}`}
            >
              <MethodBadge method={method} className="w-12 text-left text-[10px] shrink-0" />
              <span className="truncate flex-1">{label}</span>
              {dirty && <span className="text-[hsl(var(--warning))] text-[10px] shrink-0" title="Unsaved changes">●</span>}
              <button
                onClick={(e) => handleClose(e, t.id)}
                className="opacity-0 group-hover:opacity-100 h-4 w-4 grid place-items-center rounded hover:bg-accent"
                data-testid={`tab-close-${t.id}`}
                aria-label="Close tab"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        </div>
        <button
          onClick={onNewScratch}
          className="ml-1 mr-1 h-7 w-7 shrink-0 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          data-testid="tab-new-scratch"
          title="New request tab"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {trailing && (
        <div className="shrink-0 h-full flex items-stretch">
          {trailing}
        </div>
      )}
    </div>
  );
}
