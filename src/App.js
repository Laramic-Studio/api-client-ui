import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";
import { setClient } from "@/lib/api/client";
import { fetchClient } from "@/lib/api/fetch-client";
import { AuthBootstrapGate } from "@/components/auth/guards";
import { AiContextProvider } from "@/providers/AiContextProvider";
import "@/lib/ai/actions/registry";
import "@/lib/ai/actions/environments";
import AppRoutes from "@/routes/AppRoutes";

export default function App() {
  const hydrateMock = useAppStore((s) => s.hydrateMock);

  useEffect(() => {
    const stored = localStorage.getItem("noidr-theme");
    const theme = stored || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");

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
          richColors
          toastOptions={{
            className: "border border-border bg-popover text-foreground",
          }}
        />
      </BrowserRouter>
    </TooltipProvider>
  );
}
