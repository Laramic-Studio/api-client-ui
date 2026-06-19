import { defineAction, defineTool } from "@/ai-tools/types";
import { useAppStore } from "@/store/useAppStore";

export const layoutTool = defineTool({
  id: "layout",
  scope: "global",
  description: "App shell — navigation, sidebars, command palette",
  getSnapshot: () => {
    const s = useAppStore.getState();
    return {
      sidebarCollapsed: s.sidebarCollapsed,
      aiSidebarOpen: s.aiSidebarOpen,
      commandPaletteOpen: s.commandOpen,
    };
  },
  actions: {
    "nav.go": defineAction({
      label: "Navigate",
      description: "Navigate to an app route",
      risk: "low",
      payloadHint: '{"path":"/builder"} | /conduits | /environments | /collections | /settings',
      validate(payload) {
        if (!payload?.path || typeof payload.path !== "string") {
          throw new Error("Missing navigation path.");
        }
      },
      execute(payload, { navigate }) {
        navigate(payload.path);
        return { ok: true, message: `Navigated to ${payload.path}` };
      },
    }),
    "layout.sidebar.toggle": defineAction({
      label: "Toggle sidebar",
      description: "Collapse or expand the left navigation sidebar",
      risk: "low",
      payloadHint: "{}",
      execute() {
        useAppStore.getState().toggleSidebar();
        const collapsed = useAppStore.getState().sidebarCollapsed;
        return { ok: true, message: collapsed ? "Sidebar collapsed." : "Sidebar expanded." };
      },
    }),
    "layout.sidebar.set": defineAction({
      label: "Set sidebar",
      description: "Open or collapse the left navigation sidebar",
      risk: "low",
      payloadHint: '{"collapsed":true|false}',
      validate(payload) {
        if (typeof payload?.collapsed !== "boolean") {
          throw new Error('payload.collapsed must be true or false.');
        }
      },
      execute(payload) {
        useAppStore.setState({ sidebarCollapsed: payload.collapsed });
        return {
          ok: true,
          message: payload.collapsed ? "Sidebar collapsed." : "Sidebar expanded.",
        };
      },
    }),
    "layout.aiSidebar.toggle": defineAction({
      label: "Toggle assistant",
      description: "Open or close the AI assistant panel",
      risk: "low",
      payloadHint: "{}",
      execute() {
        useAppStore.getState().toggleAiSidebar();
        const open = useAppStore.getState().aiSidebarOpen;
        return { ok: true, message: open ? "Assistant opened." : "Assistant closed." };
      },
    }),
    "layout.aiSidebar.set": defineAction({
      label: "Set assistant panel",
      description: "Open or close the AI assistant panel",
      risk: "low",
      payloadHint: '{"open":true|false}',
      validate(payload) {
        if (typeof payload?.open !== "boolean") {
          throw new Error("payload.open must be true or false.");
        }
      },
      execute(payload) {
        useAppStore.getState().setAiSidebarOpen(payload.open);
        return { ok: true, message: payload.open ? "Assistant opened." : "Assistant closed." };
      },
    }),
    "layout.commandPalette.open": defineAction({
      label: "Open command palette",
      description: "Open the quick command palette (Cmd+K)",
      risk: "low",
      payloadHint: "{}",
      execute() {
        useAppStore.getState().setCommandOpen(true);
        return { ok: true, message: "Command palette opened." };
      },
    }),
  },
});
