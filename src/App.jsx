import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useAppStore } from "@/store/useAppStore";
import { setClient } from "@/lib/api/client";
import { fetchClient } from "@/lib/api/fetch-client";
import { AuthBootstrapGate } from "@/components/auth/guards";
import { AiContextProvider } from "@/providers/AiContextProvider";
import "@/ai-tools";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  const hydrateMock = useAppStore((s) => s.hydrateMock);

  useEffect(() => {
    applyTheme(getStoredTheme());

    setClient(fetchClient);
    hydrateMock();
  }, [hydrateMock]);

  return (
    <TooltipProvider delayDuration={150}>
      <BrowserRouter>
        <AuthBootstrapGate>
          <AiContextProvider>
            <AppRoutes />
          </AiContextProvider>
        </AuthBootstrapGate>
        <Toaster
          position="bottom-right"
          theme="system"
          toastOptions={{
            className: "border border-border bg-popover text-foreground",
          }}
        />
      </BrowserRouter>
    </TooltipProvider>
  );
}
