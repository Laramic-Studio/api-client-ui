import { Routes, Route, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  VerifyEmailRoute,
  OnboardingRoute,
  CatchAllRedirect,
} from "@/components/auth/guards";

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
import AcceptInvitation from "@/pages/AcceptInvitation";
import Settings from "@/pages/Settings";
import Team from "@/pages/Team";
import Conduits from "@/pages/Conduits";
import Generators from "@/pages/Generators";
import ImportApi from "@/pages/ImportApi";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/verify-email" element={<VerifyEmailRoute><VerifyEmail /></VerifyEmailRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
      <Route path="/accept-invitation/:code" element={<ProtectedRoute><AcceptInvitation /></ProtectedRoute>} />
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
        <Route path="/conduits/:conduitId?" element={<Conduits />} />
        <Route path="/generators" element={<Generators />} />
        <Route path="/import" element={<ImportApi />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}
