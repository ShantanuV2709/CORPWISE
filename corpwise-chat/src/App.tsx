import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import ChatWidget from "./components/ChatWidget";
import { MainLayout } from "./components/MainLayout";
import SystemProcessing from "./components/SystemProcessing";

// Lazy Load Pages for Performance Optimization
const LandingPage = lazy(() => import("./pages/LandingPage").then(module => ({ default: module.LandingPage })));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout").then(module => ({ default: module.DashboardLayout })));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage").then(module => ({ default: module.AdminLoginPage })));
// Handle default vs named exports carefully. AdminPanel is likely a named export based on previous file reads.
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(module => ({ default: module.AdminPanel })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then(module => ({ default: module.OnboardingPage })));
const ChatWindow = lazy(() => import("./components/ChatWindow"));
const TierSelection = lazy(() => import("./pages/TierSelection").then(module => ({ default: module.TierSelection })));
const SuperAdminDashboard = lazy(() => import("./components/SuperAdminDashboard").then(module => ({ default: module.SuperAdminDashboard })));

// Loading Fallback Component
const PageLoader = () => (
  <div style={{
    height: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bg-primary)"
  }}>
    <SystemProcessing />
  </div>
);

// Wrapper component so super admin token is read reactively inside a component (not at route render time)
function SuperAdminPage() {
  const token = localStorage.getItem('super_admin_token') || '';
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return (
    <React.Suspense fallback={<PageLoader />}>
      <SuperAdminDashboard
        token={token}
        onLogout={() => {
          localStorage.removeItem('super_admin_token');
          window.location.href = '/';
        }}
      />
    </React.Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* 
        Suspense wraps the lazy-loaded components. 
        It shows the fallback while the code chunks are being downloaded.
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/choose-plan" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/chat" element={<ChatWindow />} />
          </Route>

          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route path="/admin" element={<DashboardLayout />}>
            <Route index element={<AdminPanel />} />
            <Route path="overview" element={<AdminPanel />} />
            <Route path="documents" element={<AdminPanel />} />
            <Route path="apikeys" element={<AdminPanel />} />
            <Route path="logs" element={<AdminPanel />} />
            <Route path="billing" element={<AdminPanel />} />
            <Route path="search-debug" element={<AdminPanel />} />
          </Route>

          <Route path="/super-admin" element={<SuperAdminPage />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>

      {/* 
        Global Widget Demo 
        (This simulates how it would look embedded on SilaiBook)
        Kept eager-loaded or could be lazy too, but usually widgets need to be ready.
      */}
      <ChatWidget />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 30, 36, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          }
        }}
      />
    </BrowserRouter>
  );
}
