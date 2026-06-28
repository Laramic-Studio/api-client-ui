import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import KvEditor from "@/components/builder/KvEditor";
import AuthEditor from "@/components/builder/AuthEditor";
import UrlInput from "@/components/builder/UrlInput";
import { CONDITION_TYPES, METHODS, PASS_TARGETS } from "@/lib/conduits/constants";
import { collectConduitVarKeys } from "@/lib/conduits/step-utils";
import { Plus, Trash2, X } from "lucide-react";

function PassEditor({ passes, onChange }) {
  const update = (idx, patch) => onChange(passes.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  const add = () => onChange([...passes, { target: "header", key: "", template: "{{value}}" }]);
  const remove = (idx) => onChange(passes.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {passes.map((pass, idx) => (
        <div key={idx} className="rounded-md border border-border p-2 space-y-1.5">
          <div className="flex gap-1.5">
            <Select value={pass.target} onValueChange={(v) => update(idx, { target: v })}>
              <SelectTrigger className="flex-1 h-8 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASS_TARGETS.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-[11px]">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-[hsl(var(--danger))]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {pass.target !== "auth_bearer" && pass.target !== "body" && (
            <Input
              value={pass.key || ""}
              onChange={(e) => update(idx, { key: e.target.value })}
              placeholder="Key"
              className="h-8 text-[11px] font-geom"
            />
          )}
          <Input
            value={pass.template || "{{value}}"}
            onChange={(e) => update(idx, { template: e.target.value })}
            placeholder="Template e.g. Bearer {{value}}"
            className="h-8 text-[11px] font-geom"
          />
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="h-7 px-0 text-[11px] text-[hsl(var(--brand))]">
        <Plus className="h-3 w-3 mr-1" /> Add pass target
      </Button>
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
        Extract from response JSON and pass values to every step connected downstream.
      </p>
      {extractions.map((ext, idx) => (
        <div key={ext.id || idx} className="rounded-md border border-border p-2.5 space-y-2">
          <div className="flex gap-1.5">
            <Input
              value={ext.path || ""}
              onChange={(e) => update(idx, {
                path: e.target.value,
                variable: ext.variable || e.target.value.replace(/\./g, "_"),
              })}
              placeholder="JSON path e.g. id or user.email"
              className="flex-1 h-8 text-[11px] font-geom"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(idx)}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-[hsl(var(--danger))]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            value={ext.variable || ""}
            onChange={(e) => update(idx, { variable: e.target.value })}
            placeholder="Variable name for {var} in later steps"
            className="h-8 text-[11px] font-geom"
          />
          <PassEditor passes={ext.passes || []} onChange={(passes) => update(idx, { passes })} />
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="h-7 px-0 text-[11px] text-[hsl(var(--brand))]">
        <Plus className="h-3 w-3 mr-1" /> Add extraction
      </Button>
    </div>
  );
}

function ConditionEditor({ condition, onChange }) {
  const c = condition || { type: "none", enabled: true };
  const set = (patch) => onChange({ ...c, ...patch });

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">Optional — skip this step when the condition is not met.</p>
      <Select
        value={c.type || "none"}
        onValueChange={(type) => {
          const next = { ...c, type };
          if (type === "status_equals" && (next.value == null || next.value === "")) {
            next.value = 200;
          }
          onChange(next);
        }}
      >
        <SelectTrigger className="h-8 text-[12px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONDITION_TYPES.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-[12px]">{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {c.type === "status_equals" && (
        <Input
          type="number"
          value={c.value ?? 200}
          onChange={(e) => set({ value: e.target.value === "" ? "" : Number(e.target.value) })}
          className="h-8 text-[12px] font-geom"
          placeholder="Status code"
        />
      )}
      {(c.type === "body_path_equals" || c.type === "body_path_exists") && (
        <Input
          value={c.path || ""}
          onChange={(e) => set({ path: e.target.value })}
          className="h-8 text-[12px] font-geom"
          placeholder="Body path e.g. success"
        />
      )}
      {c.type === "body_path_equals" && (
        <Input
          value={c.value ?? ""}
          onChange={(e) => set({ value: e.target.value })}
          className="h-8 text-[12px] font-geom"
          placeholder="Expected value"
        />
      )}
      {c.type === "variable_equals" && (
        <>
          <Input
            value={c.variable || ""}
            onChange={(e) => set({ variable: e.target.value })}
            className="h-8 text-[12px] font-geom"
            placeholder="Variable name"
          />
          <Input
            value={c.value ?? ""}
            onChange={(e) => set({ value: e.target.value })}
            className="h-8 text-[12px] font-geom"
            placeholder="Expected value"
          />
        </>
      )}
    </div>
  );
}

export default function ConduitStepEditor({
  step,
  allSteps = [],
  selectedEnv = null,
  onChange,
  onClose,
  onDelete,
  readOnly = false,
}) {
  const conduitVarKeys = useMemo(() => collectConduitVarKeys(allSteps), [allSteps]);

  if (!step) {
    return (
      <div className="h-full grid place-items-center text-[12px] text-muted-foreground p-4 text-center">
        Select a step on the canvas to edit its request, extractions, and conditions.
      </div>
    );
  }

  const patch = (p) => {
    if (readOnly) return;
    onChange({ ...step, ...p });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-border">
        <span className="text-[13px] font-medium truncate flex-1">{step.name}</span>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--danger))]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <fieldset disabled={readOnly} className="flex-1 min-h-0 flex flex-col border-0 m-0 p-0 min-w-0">
        <Tabs defaultValue="request" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="mx-3 mt-2 shrink-0">
            <TabsTrigger value="request" className="text-[11px]">Request</TabsTrigger>
            <TabsTrigger value="extract" className="text-[11px]">Extract & pass</TabsTrigger>
            <TabsTrigger value="condition" className="text-[11px]">Condition</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="flex-1 min-h-0 overflow-auto px-3 pb-3 mt-2 space-y-3">
            <Input
              value={step.name ?? ""}
              onChange={(e) => patch({ name: e.target.value })}
              className="h-8 text-[12px]"
              placeholder="Step name"
            />
            <div className="flex gap-0 rounded-md border border-border overflow-hidden">
              <Select value={step.method} onValueChange={(method) => patch({ method })}>
                <SelectTrigger className="h-8 w-[88px] shrink-0 rounded-none border-0 border-r border-border text-[12px] font-geom shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-[12px] font-geom">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <UrlInput
                value={step.url ?? ""}
                onChange={(url) => patch({ url })}
                env={selectedEnv}
                conduitVarKeys={conduitVarKeys}
                compact
                grouped
                placeholder="[[BASE_URL]]/path or {variable}"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom mb-1">Params</div>
              <KvEditor rows={step.params || []} onChange={(params) => patch({ params })} addLabel="Add param" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom mb-1">Headers</div>
              <KvEditor rows={step.headers || []} onChange={(headers) => patch({ headers })} addLabel="Add header" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom mb-1">Body</div>
              <Select
                value={step.body?.type || "none"}
                onValueChange={(type) => patch({ body: { ...step.body, type } })}
              >
                <SelectTrigger className="mb-1.5 h-8 w-full text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-[11px]">None</SelectItem>
                  <SelectItem value="json" className="text-[11px]">JSON</SelectItem>
                  <SelectItem value="raw" className="text-[11px]">Raw</SelectItem>
                </SelectContent>
              </Select>
              {step.body?.type !== "none" && (
                <Textarea
                  value={step.body?.content || ""}
                  onChange={(e) => patch({ body: { ...step.body, content: e.target.value } })}
                  rows={6}
                  className="text-[11px] font-geom resize-y"
                  placeholder='{"key": "{variable}"}'
                />
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom mb-1">Auth</div>
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
              onChange={(condition) => patch({ condition: condition?.type === "none" ? null : condition })}
            />
          </TabsContent>
        </Tabs>
      </fieldset>
    </div>
  );
}
