import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CommandPalette from "@/components/layout/CommandPalette";
import AiSidebar from "@/components/ai/AiSidebar";
import TeamPermissionsBootstrap from "@/components/shared/TeamPermissionsBootstrap";
import { useConduits } from "@/hooks/use-conduits";
import { useAppStore } from "@/store/useAppStore";

const SIDEBAR_WIDTH = 56;

export default function AppLayout() {
  useConduits();
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const toggleAiSidebar = useAppStore((s) => s.toggleAiSidebar);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen(true); }
      if (cmd && e.key.toLowerCase() === "j") { e.preventDefault(); toggleAiSidebar(); }
      if (cmd && e.key.toLowerCase() === "/") { e.preventDefault(); navigate("/builder"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen, navigate, toggleAiSidebar]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      <TeamPermissionsBootstrap />
      <Topbar />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <aside
          style={{ width: SIDEBAR_WIDTH }}
          className="shrink-0 border-r border-border bg-background"
        >
          <Sidebar />
        </aside>
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <main className="flex-1 min-h-0 min-w-0 overflow-hidden bg-background">
            <Outlet />
          </main>
          <AiSidebar />
        </div>
      </div>
      <CommandPalette />
    </div>
  );
}
