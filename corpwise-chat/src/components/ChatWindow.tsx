import React, { useRef, useEffect } from "react";
import DecryptedText from "./DecryptedText";
import SystemProcessing from "./SystemProcessing";
import { MessageBubble } from "./MessageBubble";
import { useChat } from "../hooks/useChat";

export default function ChatWindow() {
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

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
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
          <div className="status-badge">Online</div>
        </div>

        <button onClick={startNewChat} className="new-chat-btn">
          + New Conversation
        </button>

        <div className="history-section">
          <div className="section-label">Recent Chats</div>
          <div className="history-list">
            {history.map(conv => (
              <div
                key={conv.conversation_id}
                onClick={() => loadConversation(conv)}
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
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-interface">
        <header className="chat-header">
          <span style={{ fontWeight: 600 }}>Internal Knowledge Assistant</span>
          <div style={{ width: 10, height: 10, background: "#22c55e", borderRadius: "50%" }}></div>
        </header>

        <div className="message-list">
          {messages.length === 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-secondary)" }}>
              Start a new conversation...
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
              <div className="message-content" style={{ background: "transparent", border: "none", padding: 0 }}>
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
