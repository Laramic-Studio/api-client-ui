import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KvEditor from "@/components/builder/KvEditor";
import AuthEditor from "@/components/builder/AuthEditor";
import { CONDITION_TYPES, METHODS, PASS_TARGETS } from "@/lib/conduits/constants";
import { Plus, Trash2, X } from "lucide-react";

function PassEditor({ passes, onChange }) {
  const update = (idx, patch) => onChange(passes.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const add = () => onChange([...passes, { target: "header", key: "", template: "{{value}}" }]);
  const remove = (idx) => onChange(passes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {passes.map((pass, idx) => (
        <div key={idx} className="rounded border border-border p-2 space-y-1.5">
          <div className="flex gap-1.5">
            <select
              value={pass.target}
              onChange={(e) => update(idx, { target: e.target.value })}
              className="flex-1 h-8 px-2 rounded border border-border bg-background text-[11px]"
            >
              {PASS_TARGETS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => remove(idx)} className="h-8 w-8 grid place-items-center text-muted-foreground hover:text-[hsl(var(--danger))]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {pass.target !== "auth_bearer" && pass.target !== "body" && (
            <input
              value={pass.key || ""}
              onChange={(e) => update(idx, { key: e.target.value })}
              placeholder="Key"
              className="w-full h-8 px-2 rounded border border-border bg-background text-[11px] font-mono"
            />
          )}
          <input
            value={pass.template || "{{value}}"}
            onChange={(e) => update(idx, { template: e.target.value })}
            placeholder="Template e.g. Bearer {{value}}"
            className="w-full h-8 px-2 rounded border border-border bg-background text-[11px] font-mono"
          />
        </div>
      ))}
      <button type="button" onClick={add} className="text-[11px] text-[hsl(var(--brand))] inline-flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add pass target
      </button>
    </div>
  );
}

function ExtractionEditor({ extractions, onChange }) {
  const update = (idx, patch) => onChange(extractions.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  const add = () => onChange([
    ...extractions,
    { id: `ext_${Date.now()}`, path: "", variable: "", passes: [] },
  ]);
  const remove = (idx) => onChange(extractions.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Extract from response JSON and choose where to pass values on the <strong>next</strong> step.
      </p>
      {extractions.map((ext, idx) => (
        <div key={ext.id || idx} className="rounded border border-border p-2.5 space-y-2">
          <div className="flex gap-1.5">
            <input
              value={ext.path || ""}
              onChange={(e) => update(idx, { path: e.target.value, variable: ext.variable || e.target.value.replace(/\./g, "_") })}
              placeholder="JSON path e.g. token or user.id"
              className="flex-1 h-8 px-2 rounded border border-border bg-background text-[11px] font-mono"
            />
            <button type="button" onClick={() => remove(idx)} className="h-8 w-8 grid place-items-center text-muted-foreground hover:text-[hsl(var(--danger))]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            value={ext.variable || ""}
            onChange={(e) => update(idx, { variable: e.target.value })}
            placeholder="Variable name for {var} in later steps"
            className="w-full h-8 px-2 rounded border border-border bg-background text-[11px] font-mono"
          />
          <PassEditor
            passes={ext.passes || []}
            onChange={(passes) => update(idx, { passes })}
          />
        </div>
      ))}
      <button type="button" onClick={add} className="text-[11px] text-[hsl(var(--brand))] inline-flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add extraction
      </button>
    </div>
  );
}

function ConditionEditor({ condition, onChange }) {
  const c = condition || { type: "none", enabled: true };
  const set = (patch) => onChange({ ...c, ...patch });

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Optional — skip this step when the condition is not met.</p>
      <select
        value={c.type || "none"}
        onChange={(e) => set({ type: e.target.value })}
        className="w-full h-8 px-2 rounded border border-border bg-background text-[12px]"
      >
        {CONDITION_TYPES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
      {c.type === "status_equals" && (
        <input
          type="number"
          value={c.value ?? 200}
          onChange={(e) => set({ value: Number(e.target.value) })}
          className="w-full h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
          placeholder="Status code"
        />
      )}
      {(c.type === "body_path_equals" || c.type === "body_path_exists") && (
        <input
          value={c.path || ""}
          onChange={(e) => set({ path: e.target.value })}
          className="w-full h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
          placeholder="Body path e.g. success"
        />
      )}
      {c.type === "body_path_equals" && (
        <input
          value={c.value ?? ""}
          onChange={(e) => set({ value: e.target.value })}
          className="w-full h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
          placeholder="Expected value"
        />
      )}
      {c.type === "variable_equals" && (
        <>
          <input
            value={c.variable || ""}
            onChange={(e) => set({ variable: e.target.value })}
            className="w-full h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
            placeholder="Variable name"
          />
          <input
            value={c.value ?? ""}
            onChange={(e) => set({ value: e.target.value })}
            className="w-full h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
            placeholder="Expected value"
          />
        </>
      )}
    </div>
  );
}

export default function ConduitStepEditor({ step, onChange, onClose, onDelete }) {
  if (!step) {
    return (
      <div className="h-full grid place-items-center text-[12px] text-muted-foreground p-4 text-center">
        Select a step on the canvas to edit its request, extractions, and conditions.
      </div>
    );
  }

  const patch = (p) => onChange({ ...step, ...p });

  return (
    <div className="h-full flex flex-col border-l border-border bg-card">
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-border">
        <span className="text-[13px] font-medium truncate flex-1">{step.name}</span>
        <button type="button" onClick={onDelete} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onClose} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Tabs defaultValue="request" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="mx-3 mt-2 shrink-0">
          <TabsTrigger value="request" className="text-[11px]">Request</TabsTrigger>
          <TabsTrigger value="extract" className="text-[11px]">Extract & pass</TabsTrigger>
          <TabsTrigger value="condition" className="text-[11px]">Condition</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="flex-1 min-h-0 overflow-auto px-3 pb-3 mt-2 space-y-3">
          <input
            value={step.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="w-full h-8 px-2 rounded border border-border bg-background text-[12px]"
            placeholder="Step name"
          />
          <div className="flex gap-2">
            <select
              value={step.method}
              onChange={(e) => patch({ method: e.target.value })}
              className="h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
            >
              {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              value={step.url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="[[BASE_URL]]/path or {variable}"
              className="flex-1 h-8 px-2 rounded border border-border bg-background text-[12px] font-mono"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Params</div>
            <KvEditor rows={step.params || []} onChange={(params) => patch({ params })} addLabel="Add param" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Headers</div>
            <KvEditor rows={step.headers || []} onChange={(headers) => patch({ headers })} addLabel="Add header" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Body</div>
            <select
              value={step.body?.type || "none"}
              onChange={(e) => patch({ body: { ...step.body, type: e.target.value } })}
              className="mb-1 h-7 px-2 rounded border border-border bg-background text-[11px]"
            >
              <option value="none">None</option>
              <option value="json">JSON</option>
              <option value="raw">Raw</option>
            </select>
            {step.body?.type !== "none" && (
              <textarea
                value={step.body?.content || ""}
                onChange={(e) => patch({ body: { ...step.body, content: e.target.value } })}
                rows={6}
                className="w-full rounded border border-border bg-background text-[11px] font-mono p-2 resize-y"
                placeholder='{"key": "{variable}"}'
              />
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">Auth</div>
            <AuthEditor auth={step.auth || { type: "none" }} onChange={(auth) => patch({ auth })} />
          </div>
        </TabsContent>

        <TabsContent value="extract" className="flex-1 min-h-0 overflow-auto px-3 pb-3 mt-2">
          <ExtractionEditor
            extractions={step.extractions || []}
            onChange={(extractions) => patch({ extractions })}
          />
        </TabsContent>

        <TabsContent value="condition" className="flex-1 min-h-0 overflow-auto px-3 pb-3 mt-2">
          <ConditionEditor
            condition={step.condition}
            onChange={(condition) => patch({ condition })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
