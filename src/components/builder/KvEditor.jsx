import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function KvEditor({ rows, onChange, addLabel = "Add row", testIdAdd }) {
  const setRow = (idx, patch) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };
  const removeRow = (idx) => onChange(rows.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-1.5 px-0.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        <div />
        <div>Key</div>
        <div>Value</div>
        <div />
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && (
          <div className="px-0.5 py-3 text-[12px] text-muted-foreground">No rows yet.</div>
        )}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[32px_1fr_1fr_32px] gap-1.5 items-center">
            <div className="flex h-8 items-center justify-center">
              <Checkbox
                checked={r.enabled !== false}
                onCheckedChange={(checked) => setRow(i, { enabled: checked === true })}
              />
            </div>
            <Input
              value={r.key}
              onChange={(e) => setRow(i, { key: e.target.value })}
              placeholder="key"
              className="h-8 text-[12px] font-mono"
            />
            <Input
              value={r.value}
              onChange={(e) => setRow(i, { value: e.target.value })}
              placeholder="value"
              className="h-8 text-[12px] font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(i)}
              className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--danger))]"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}
        className="mt-2 h-8 px-0 text-[12px] text-muted-foreground hover:text-foreground"
        data-testid={testIdAdd}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" /> {addLabel}
      </Button>
    </div>
  );
}
