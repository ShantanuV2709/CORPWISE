import { useState, useEffect } from "react";
import DecryptedText from "./DecryptedText";
import SystemProcessing from "./SystemProcessing";

import { sendQuery, getHistory } from "../api/chat";
import { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { v4 as uuidv4 } from "uuid";

interface ConversationSummary {
  conversation_id: string;
  title: string;
  updated_at: string;
  messages?: Message[];
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Persistent User ID for history grouping
  const [userId] = useState(() => {
    let stored = localStorage.getItem("app_user_id");
    if (!stored) {
      stored = uuidv4();
      localStorage.setItem("app_user_id", stored);
    }
    return stored;
  });

  // Current active conversation ID
  const [conversationId, setConversationId] = useState<string>(() => uuidv4());

  // History list
  const [history, setHistory] = useState<ConversationSummary[]>([]);

  // Fetch history on mount
  useEffect(() => {
    loadHistory();
  }, [userId]);

  async function loadHistory() {
    try {
      const data = await getHistory(userId);
      // Sort by updated_at desc
      const sorted = data.sort((a: any, b: any) =>
        new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
      );
      setHistory(sorted);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }

  function startNewChat() {
    setConversationId(uuidv4()); // New ID
    setMessages([]); // Clear view
  }

  function loadConversation(conv: ConversationSummary) {
    setConversationId(conv.conversation_id);
    // If backend returns messages in history list (it does based on our check)
    if (conv.messages) {
      setMessages(conv.messages);
    } else {
      setMessages([]); // Or fetch messages for this conv if not provided
    }
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendQuery(userId, conversationId, input);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.reply,
        meta: response
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Refresh history list to show new title/update time
      loadHistory();

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get response from server."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

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
        </div>
        <div className="input-area">
          <div className="input-wrapper">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask a question about Corpwise..."
            />
            <button className="send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
