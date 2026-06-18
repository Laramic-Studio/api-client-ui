import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import AiChat from "@/components/ai/AiChat";
import { AI } from "@/constants/testIds";

export default function AiSidebar() {
  const open = useAppStore((s) => s.aiSidebarOpen);
  const width = useAppStore((s) => s.aiSidebarWidth);
  const setOpen = useAppStore((s) => s.setAiSidebarOpen);
  const setWidth = useAppStore((s) => s.setAiSidebarWidth);

  useEffect(() => {
    let resizing = false;
    const onDown = (e) => {
      if (e.target?.dataset?.testid === AI.resizeHandle) {
        resizing = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
      }
    };
    const onMove = (e) => {
      if (!resizing) return;
      setWidth(window.innerWidth - e.clientX);
    };
    const onUp = () => {
      if (!resizing) return;
      resizing = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setWidth]);

  if (!open) return null;

  return (
    <aside
      style={{ width }}
      className="shrink-0 border-l border-border bg-background flex flex-col relative min-h-0"
      data-testid={AI.sidebar}
    >
      <div
        data-testid={AI.resizeHandle}
        className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--brand))]/40 z-10"
      />
      <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-border">
        <Sparkles className="h-4 w-4 text-[hsl(var(--brand))]" />
        <div className="text-[13px] font-medium">Assistant</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto h-7 w-7 grid place-items-center rounded-md hover:bg-accent/50 text-muted-foreground"
          aria-label="Close assistant"
          data-testid={AI.close}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <AiChat />
      </div>
    </aside>
  );
}
