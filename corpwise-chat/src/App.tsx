import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleSelection } from "./pages/RoleSelection";
import { AdminPanel } from "./pages/AdminPanel";
import ChatWindow from "./components/ChatWindow";
import ChatWidget from "./components/ChatWidget";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/chat" element={<ChatWindow />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* 
        Global Widget Demo 
        (This simulates how it would look embedded on SilaiBook)
      */}
      <ChatWidget />
    </BrowserRouter>
  );
}
