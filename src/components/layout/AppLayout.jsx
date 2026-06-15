import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CommandPalette from "@/components/layout/CommandPalette";
import { useAppStore } from "@/store/useAppStore";

export default function AppLayout() {
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const navigate = useNavigate();

  // global shortcuts
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); setCommandOpen(true); }
      if (cmd && e.key.toLowerCase() === "/") { e.preventDefault(); navigate("/builder"); }
      if (cmd && e.key === "b") { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen, navigate, toggleSidebar]);

  // Auto-collapse on small screens (responsive) AND when entering /builder
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      if (w < 900 && !useAppStore.getState().sidebarCollapsed) {
        useAppStore.setState({ sidebarCollapsed: true });
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // Auto-collapse on /builder for max screen real-estate
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.startsWith("/builder") && !useAppStore.getState().sidebarCollapsed) {
      useAppStore.setState({ sidebarCollapsed: true });
    }
  }, [location.pathname]);

  // resize handle
  useEffect(() => {
    let resizing = false;
    const onDown = (e) => {
      if (e.target?.dataset?.testid === "sidebar-resize-handle") {
        resizing = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
      }
    };
    const onMove = (e) => {
      if (!resizing) return;
      setSidebarWidth(Math.min(380, Math.max(180, e.clientX)));
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
  }, [setSidebarWidth]);

  const effectiveWidth = collapsed ? 56 : sidebarWidth;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
      <aside
        style={{ width: effectiveWidth }}
        className="shrink-0 border-r border-border bg-background transition-[width] duration-200 relative"
      >
        <Sidebar collapsed={collapsed} />
        {!collapsed && (
          <div
            data-testid="sidebar-resize-handle"
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-[hsl(var(--brand))]/40 z-10"
          />
        )}
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 min-h-0 overflow-hidden bg-background">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
