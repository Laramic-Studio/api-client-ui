import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import MethodBadge from "@/components/shared/MethodBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { Plus, Trash2, Edit, Server } from "lucide-react";
import { MOCK } from "@/constants/testIds";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Editor from "@monaco-editor/react";
import { METHODS_LIST } from "@/lib/mockData";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function MockServers() {
  const mockServers = useAppStore((s) => s.mockServers);
  const create = useAppStore((s) => s.createMockEndpoint);
  const update = useAppStore((s) => s.updateMockEndpoint);
  const del = useAppStore((s) => s.deleteMockEndpoint);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openNew = () => setEditing({
    name: "",
    method: "GET",
    path: "/endpoint",
    status: 200,
    delayMs: 0,
    enabled: true,
    response: { success: true, data: {} },
  });

  const save = () => {
    if (!editing.path) return toast.error("Path is required");
    if (editing.id) {
      update(editing.id, editing);
      toast.success("Mock endpoint updated");
    } else {
      create({ ...editing, name: editing.name || `${editing.method} ${editing.path}` });
      toast.success("Mock endpoint created");
    }
    setEditing(null);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-geom">// virtual backend</div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">Mock Servers</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Stand up an entire API in minutes — no backend required.</p>
        </div>
        <button
          onClick={openNew}
          data-testid={MOCK.newEndpoint}
          className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium inline-flex items-center gap-2"
        >
          <Plus className="h-3.5 w-3.5" /> New endpoint
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_70px_80px_80px_60px_60px] gap-2 px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-geom">
          <div>Endpoint</div>
          <div>Method</div>
          <div>Status</div>
          <div>Delay</div>
          <div className="text-right">State</div>
          <div></div>
          <div></div>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {mockServers.map((m) => (
            <div key={m.id} className="grid grid-cols-[1fr_70px_70px_80px_80px_60px_60px] gap-2 px-4 py-2 items-center text-[12.5px] hover:bg-accent/50" data-testid={MOCK.item(m.id)}>
              <div className="flex items-center gap-2 min-w-0">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate font-geom">{m.path}</span>
              </div>
              <MethodBadge method={m.method} />
              <StatusBadge status={m.status} />
              <span className="font-geom text-[11px] text-muted-foreground">{m.delayMs}ms</span>
              <div className="text-right">
                <Switch checked={m.enabled} onCheckedChange={(v) => update(m.id, { enabled: v })} />
              </div>
              <button onClick={() => setEditing(m)} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-foreground/85">
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setDeleteTarget(m)} className="h-7 w-7 grid place-items-center rounded hover:bg-accent/50 text-muted-foreground hover:text-[hsl(var(--danger))]">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editing?.id ? "Edit endpoint" : "New mock endpoint"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] uppercase font-geom text-muted-foreground">Method</Label>
                  <Select value={editing.method} onValueChange={(v) => setEditing({ ...editing, method: v })}>
                    <SelectTrigger className="bg-muted border-border h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      {METHODS_LIST.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] uppercase font-geom text-muted-foreground">Path</Label>
                  <Input value={editing.path} onChange={(e) => setEditing({ ...editing, path: e.target.value })} className="bg-muted border-border h-9 font-geom" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] uppercase font-geom text-muted-foreground">Status code</Label>
                  <Input type="number" value={editing.status} onChange={(e) => setEditing({ ...editing, status: Number(e.target.value) || 200 })} className="bg-muted border-border h-9 font-geom" />
                </div>
                <div>
                  <Label className="text-[11px] uppercase font-geom text-muted-foreground">Delay (ms)</Label>
                  <Input type="number" value={editing.delayMs} onChange={(e) => setEditing({ ...editing, delayMs: Number(e.target.value) || 0 })} className="bg-muted border-border h-9 font-geom" />
                </div>
                <div>
                  <Label className="text-[11px] uppercase font-geom text-muted-foreground">Enabled</Label>
                  <div className="h-9 flex items-center"><Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} /></div>
                </div>
              </div>
              <div>
                <Label className="text-[11px] uppercase font-geom text-muted-foreground">Response body</Label>
                <div className="mt-1 h-48 rounded-md overflow-hidden border border-border">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={JSON.stringify(editing.response, null, 2)}
                    onChange={(v) => { try { setEditing({ ...editing, response: JSON.parse(v || "{}") }); } catch { /* ignore parse errors during typing */ } }}
                    theme="vs-dark"
                    options={{ minimap: { enabled: false }, fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setEditing(null)} className="h-9 px-3 rounded-md border border-border text-[13px] hover:bg-accent/50">Cancel</button>
            <button onClick={save} className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-foreground text-[13px] font-medium">Save endpoint</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete mock endpoint"
        description={deleteTarget ? `Delete ${deleteTarget.method} ${deleteTarget.path || deleteTarget.url || "endpoint"}?` : ""}
        onConfirm={() => {
          if (deleteTarget) {
            del(deleteTarget.id);
            toast.success("Endpoint deleted");
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
