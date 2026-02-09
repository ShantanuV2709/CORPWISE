import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import { MainLayout } from "./components/MainLayout";
import SystemProcessing from "./components/SystemProcessing";

// Lazy Load Pages for Performance Optimization
const RoleSelection = lazy(() => import("./pages/RoleSelection").then(module => ({ default: module.RoleSelection })));
// Handle default vs named exports carefully. AdminPanel is likely a named export based on previous file reads.
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(module => ({ default: module.AdminPanel })));
const ChatWindow = lazy(() => import("./components/ChatWindow"));
const TierSelection = lazy(() => import("./pages/TierSelection").then(module => ({ default: module.TierSelection })));

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
            <Route path="/" element={<RoleSelection />} />
            <Route path="/choose-plan" element={<TierSelection />} />
            <Route path="/chat" element={<ChatWindow />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </Suspense>

      {/* 
        Global Widget Demo 
        (This simulates how it would look embedded on SilaiBook)
        Kept eager-loaded or could be lazy too, but usually widgets need to be ready.
      */}
      <ChatWidget />
    </BrowserRouter>
  );
}
