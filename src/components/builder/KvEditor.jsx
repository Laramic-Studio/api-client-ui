import { Plus, X } from "lucide-react";

export default function KvEditor({ rows, onChange, addLabel = "Add row", testIdAdd }) {
  const setRow = (idx, patch) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };
  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx));
  return (
    <div className="p-2">
      <div className="grid grid-cols-[24px_1fr_1fr_28px] gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        <div></div><div>Key</div><div>Value</div><div></div>
      </div>
      <div className="space-y-1">
        {rows.length === 0 && (
          <div className="px-2 py-3 text-[12px] text-muted-foreground">No rows yet.</div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[24px_1fr_1fr_28px] gap-1 items-center">
            <input
              type="checkbox"
              checked={r.enabled !== false}
              onChange={(e) => setRow(i, { enabled: e.target.checked })}
              className="accent-[hsl(var(--brand))] mx-auto"
            />
            <input
              value={r.key}
              onChange={(e) => setRow(i, { key: e.target.value })}
              placeholder="key"
              className="h-8 px-2 rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[12.5px] font-mono ring-focus"
            />
            <input
              value={r.value}
              onChange={(e) => setRow(i, { value: e.target.value })}
              placeholder="value"
              className="h-8 px-2 rounded bg-[hsl(var(--input))] border border-[hsl(var(--border))] text-[12.5px] font-mono ring-focus"
            />
            <button
              onClick={() => removeRow(i)}
              className="h-8 w-8 grid place-items-center rounded text-muted-foreground hover:text-[hsl(var(--danger))] hover:bg-accent/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"
        data-testid={testIdAdd}
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}
