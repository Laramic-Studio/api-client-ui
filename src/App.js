import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";

import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
import ResetPassword from "@/pages/auth/ResetPassword";
import Onboarding from "@/pages/auth/Onboarding";
import PublicDocs from "@/pages/PublicDocs";

import Dashboard from "@/pages/Dashboard";
import Collections from "@/pages/Collections";
import ApiBuilder from "@/pages/ApiBuilder";
import Environments from "@/pages/Environments";
import MockServers from "@/pages/MockServers";
import Documentation from "@/pages/Documentation";
import History from "@/pages/History";
import Monitoring from "@/pages/Monitoring";
import Workspaces from "@/pages/Workspaces";
import Settings from "@/pages/Settings";
import Team from "@/pages/Team";
import Conduits from "@/pages/Conduits";
import Generators from "@/pages/Generators";
import ImportApi from "@/pages/ImportApi";

function ProtectedRoute({ children }) {
  const user = useAppStore((s) => s.user);
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicOnly({ children }) {
  const user = useAppStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const hydrateMock = useAppStore((s) => s.hydrateMock);
  useEffect(() => {
    // Apply dark mode by default
    const stored = localStorage.getItem("noidr-theme");
    const theme = stored || "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    hydrateMock();
  }, [hydrateMock]);

  return (
    <TooltipProvider delayDuration={150}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/p/docs/:shareId" element={<PublicDocs />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/builder" element={<ApiBuilder />} />
            <Route path="/builder/:requestId" element={<ApiBuilder />} />
            <Route path="/environments" element={<Environments />} />
            <Route path="/mock-servers" element={<MockServers />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/history" element={<History />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/team" element={<Team />} />
            <Route path="/conduits" element={<Conduits />} />
            <Route path="/generators" element={<Generators />} />
            <Route path="/import" element={<ImportApi />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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

export default App;
