import { GENERATORS } from "@/lib/generators";
import { Copy, Sparkles, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Generators() {
  const [vals, setVals] = useState(() => Object.fromEntries(GENERATORS.map((g) => [g.id, g.fn()])));

  const regenerate = (id) => {
    const g = GENERATORS.find((x) => x.id === id);
    if (!g) return;
    setVals((v) => ({ ...v, [id]: g.fn() }));
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// utilities</div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">Dynamic Generators</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Pre-built helpers for tokens, timestamps, IDs, and more. Use anywhere in requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {GENERATORS.map((g) => (
          <div key={g.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--brand))]" />
              <div className="text-[13.5px] font-medium">{g.name}</div>
            </div>
            <div className="text-[11.5px] text-muted-foreground mt-0.5">{g.description}</div>
            <div className="mt-3 px-2.5 py-2 rounded bg-card border border-border font-geom text-[12px] break-all min-h-[42px] text-foreground/90">
              {vals[g.id]}
            </div>
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={() => regenerate(g.id)}
                className="h-7 px-2 rounded text-[12px] border border-border hover:bg-accent/50 inline-flex items-center gap-1.5"
                data-testid={`gen-regen-${g.id}`}
              >
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
              <button
                onClick={() => { navigator.clipboard?.writeText(vals[g.id]); toast.success("Copied"); }}
                className="h-7 px-2 rounded text-[12px] border border-border hover:bg-accent/50 inline-flex items-center gap-1.5"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
