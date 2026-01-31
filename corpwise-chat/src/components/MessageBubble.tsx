import React from "react";
import { Message } from "../types/chat";

// Custom formatter to handle simple Markdown (Bold & Lists) without heavy dependencies
function formatMessage(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Check for bold text: **text**
    // We'll process inline bolding first
    const processBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    // Check for list items: "- Item" or "* Item"
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      currentList.push(
        <li key={`li-${i}`}>{processBold(line.trim().substring(2))}</li>
      );
    } else {
      // Flush list if exists
      if (currentList.length > 0) {
        elements.push(<ul key={`ul-${i}`}>{currentList}</ul>);
        currentList = [];
      }

      // Regular paragraph (if not empty)
      if (line.trim()) {
        elements.push(
          <p key={`p-${i}`} style={{ marginBottom: 8 }}>
            {processBold(line)}
          </p>
        );
      }
    }
  });

  // Flush remaining list
  if (currentList.length > 0) {
    elements.push(<ul key="ul-end">{currentList}</ul>);
  }

  return <div className="markdown-content">{elements}</div>;
}

export function MessageBubble({
  message,
  conversationId
}: {
  message: Message;
  conversationId: string;
}) {
  const isUser = message.role === "user";
  const confidence = message.meta?.confidence || "low";

  return (
    <div className={`message-row ${isUser ? "user" : "assistant"}`}>
      <div className={`avatar ${isUser ? "user" : "bot"}`}>
        {isUser ? "U" : "AI"}
      </div>

      <div className="message-bubble-container">
        <div className="message-content">
          {isUser ? message.content : formatMessage(message.content)}
        </div>

        {/* Meta Info (Only for Assistant) */}
        {!isUser && message.meta && (
          <div className="meta-chips">
            {/* Confidence Chip */}
            <span className={`chip confidence-${confidence}`}>
              {confidence.toUpperCase()} Confidence
            </span>

            {/* Source Chips */}
            {message.meta.sources && message.meta.sources.map((src, i) => (
              <span key={i} className="chip source">
                📄 {src.split("/").pop()}
              </span>
            ))}

            {/* Cached Chip */}
            {message.meta.cached && (
              <span className="chip cached">⚡ Cached</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
