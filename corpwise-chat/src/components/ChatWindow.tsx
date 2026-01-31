import { useState } from "react";
import { sendQuery } from "../api/chat";
import { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { v4 as uuidv4 } from "uuid";

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const conversationId =
    sessionStorage.getItem("conversation_id") ??
    (() => {
      const id = uuidv4();
      sessionStorage.setItem("conversation_id", id);
      return id;
    })();

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
      const response = await sendQuery(conversationId, input);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.reply,   // ✅ THIS WAS THE MISSING LINK
        meta: response
      };

      setMessages(prev => [...prev, assistantMessage]);
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
      {/* Sidebar (Visual Only for now) */}
      <aside style={{ width: 260, borderRight: "1px solid var(--border-color)", padding: 20, display: "flex", flexDirection: "column" }}>
        <h2 className="brand-title" style={{ marginBottom: 30 }}>CORPWISE</h2>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          <p style={{ marginBottom: 10 }}>History</p>
          <div style={{ padding: 10, background: "var(--bg-card)", borderRadius: 8, fontSize: "0.85rem", cursor: "pointer" }}>
            New Conversation
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-interface">
        <header className="chat-header">
          <span style={{ fontWeight: 600 }}>Internal Knowledge Assistant</span>
          <div style={{ width: 10, height: 10, background: "#22c55e", borderRadius: "50%" }}></div>
        </header>

        <div className="message-list">
          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              conversationId={conversationId}
            />
          ))}
          {loading && (
            <div className="message-row assistant">
              <div className="avatar bot">AI</div>
              <div className="message-content" style={{ color: "var(--text-secondary)" }}>
                Thinking...
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
