import React, { useRef, useEffect } from "react";
import DecryptedText from "./DecryptedText";
import SystemProcessing from "./SystemProcessing";
import { MessageBubble } from "./MessageBubble";
import { useChat } from "../hooks/useChat";

export default function ChatWindow() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Uses the shared hook (Brain)
  const {
    messages,
    loading,
    input,
    setInput,
    history,
    sendMessage,
    startNewChat,
    loadConversation,
    conversationId
  } = useChat();

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Close sidebar when selecting a chat on mobile
  const handleChatSelect = (conv: any) => {
    loadConversation(conv);
    setIsSidebarOpen(false);
  };

  return (
    <div className="chat-layout-container" style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-title">
            <DecryptedText
              text="CORPWISE"
              animateOn="view"
              revealDirection="start"
              sequential={true}
              speed={100}
              className="revealed"
              encryptedClassName="encrypted"
            />
          </div>
          <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <button onClick={() => { startNewChat(); setIsSidebarOpen(false); }} className="new-chat-btn">
          + New Conversation
        </button>

        <div className="history-section">
          <div className="section-label">Recent Chats</div>
          <div className="history-list">
            {history.map(conv => (
              <div
                key={conv.conversation_id}
                onClick={() => handleChatSelect(conv)}
                className={`history-item ${conv.conversation_id === conversationId ? "active" : ""}`}
              >
                {conv.title || "New Chat"}
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <a href="/admin" className="admin-link">
            🔒 Admin Portal
          </a>
          <button
            onClick={() => {
              localStorage.removeItem("app_user_id");
              localStorage.removeItem("app_company_id");
              window.location.href = "/";
            }}
            className="admin-link"
            style={{
              marginTop: "10px",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-interface">
        <header className="chat-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Hamburger Button */}
            <button
              className="hamburger-btn"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600 }}>Internal Knowledge Assistant</span>
              <div style={{ fontSize: "0.75rem", opacity: 0.9, color: "#94a3b8", display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  👤 <span style={{ color: "#60a5fa", fontWeight: 600 }}>{localStorage.getItem("app_user_id") || "Guest"}</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  🏢 <span style={{ color: "#34d399", fontWeight: 600 }}>{localStorage.getItem("app_company_id") || "N/A"}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="status-badge-desktop">Online</div>
        </header>

        <div className="message-list">
          {messages.length === 0 && (
            <div className="empty-state-message">
              <DecryptedText
                text="Start a new conversation..."
                speed={120}
                className="revealed"
                encryptedClassName="encrypted"
              />
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              conversationId={conversationId}
            />
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-content glass-loader">
                <SystemProcessing />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="input-area">
          <div className="input-wrapper">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask a question about Corpwise..."
              autoFocus
            />
            <button className="send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
