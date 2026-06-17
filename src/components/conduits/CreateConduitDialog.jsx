import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ConduitVisibilityPicker from "@/components/conduits/ConduitVisibilityPicker";
import { Loader2 } from "lucide-react";

export default function CreateConduitDialog({ open, onOpenChange, onCreate, loading = false }) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [sharedWith, setSharedWith] = useState([]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setVisibility("private");
    setSharedWith([]);
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({
      name: trimmed,
      visibility,
      sharedWith,
      steps: [],
      layout: { edges: [] },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-[15px]">New conduit</DialogTitle>
            <DialogDescription className="text-[13px]">
              Name your workflow and choose who can access it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="conduit-name" className="text-[12px] font-medium">
                Name
              </label>
              <input
                id="conduit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auth → Profile flow"
                autoFocus
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] outline-none focus:ring-1 focus:ring-[hsl(var(--brand))]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium">Visibility</label>
              <ConduitVisibilityPicker
                variant="form"
                visibility={visibility}
                sharedWith={sharedWith}
                onChange={({ visibility: v, sharedWith: sw }) => {
                  setVisibility(v);
                  setSharedWith(sw || []);
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 px-3 rounded-md border border-border text-[13px] hover:bg-accent/50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create conduit
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
