import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { aiBuildRequest } from "@/lib/api/ai";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

const EXAMPLES = [
  "Create a user with name and email",
  "Fetch the 3rd page of orders sorted by total descending",
  "Patch a product by id to mark it discontinued",
  "List all webhooks for the active tenant",
];

export default function AskAIDialog({ open, onOpenChange, envVars, onApply }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const ai = useAppStore((s) => s.aiSettings);
  const user = useAppStore((s) => s.user);
  const bumpUsage = useAppStore((s) => s.bumpAiUsage);
  const history = useAppStore((s) => s.aiPromptHistory);
  const pushPrompt = useAppStore((s) => s.pushAiPrompt);
  const clearPrompts = useAppStore((s) => s.clearAiPrompts);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const spec = await aiBuildRequest({ prompt, envVars, userId: user?.id, ai });
      bumpUsage("build");
      pushPrompt({ prompt, method: spec?.method, url: spec?.url });
      onApply(spec);
      toast.success("Applied AI-generated request");
      onOpenChange(false);
      setPrompt("");
    } catch (e) {
      toast.error(e.message || "AI build failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-[hsl(var(--border))] max-w-xl" data-testid="ask-ai-dialog">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[hsl(var(--brand))]" /> Ask AI
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-[12.5px] text-muted-foreground">
            Describe the API call in plain English. The model fills in method, URL, headers and body.
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            data-testid="ask-ai-input"
            placeholder="e.g. Create a new user named Maya with email maya@noidr.dev and role developer"
            className="w-full min-h-[100px] p-3 rounded-md bg-muted border border-[hsl(var(--border))] text-[13px] font-geom ring-focus"
          />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="px-2 py-1 rounded border border-[hsl(var(--border))] text-[11px] text-muted-foreground hover:bg-accent/40"
              >
                {ex}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <div className="rounded-md border border-[hsl(var(--border))] bg-card max-h-40 overflow-auto" data-testid="ai-history">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-[hsl(var(--border))]">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-geom">Recent prompts</div>
                <button onClick={clearPrompts} className="text-[11px] text-muted-foreground hover:text-foreground" data-testid="ai-history-clear">Clear</button>
              </div>
              <div className="divide-y divide-[hsl(var(--border))]">
                {history.slice(0, 6).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setPrompt(h.prompt)}
                    className="w-full text-left px-2 py-1.5 hover:bg-accent/40"
                    data-testid={`ai-history-${h.id}`}
                  >
                    <div className="text-[12.5px] truncate">{h.prompt}</div>
                    {h.method && (
                      <div className="text-[10px] text-muted-foreground font-geom uppercase tracking-wider truncate">
                        {h.method} {h.url}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground font-geom">
            Provider: <span className="text-foreground/80">{ai.provider}/{ai.model}</span>
            {ai.useOwnKey ? " · using your key" : " · free tier"}
            <span className="ml-2">Used {ai.usage.total}/{ai.usage.limit}</span>
          </div>
        </div>
        <DialogFooter>
          <button onClick={() => onOpenChange(false)} className="h-9 px-3 rounded-md border border-[hsl(var(--border))] text-[13px] hover:bg-accent/40">
            Cancel
          </button>
          <button
            onClick={run}
            disabled={loading || !prompt.trim()}
            data-testid="ask-ai-submit"
            className="h-9 px-3 rounded-md bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white text-[13px] font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Thinking…" : "Build request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
