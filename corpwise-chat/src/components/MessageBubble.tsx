import React from "react";
import { Message } from "../types/chat";

// Custom formatter to handle simple Markdown (Bold, Lists, Code)
function formatMessage(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let currentList: React.ReactNode[] = [];
  let isOrdered = false;

  lines.forEach((line, i) => {

    // Helper for Bold (**text**) processing
    const processBold = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={idx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    // Helper for Code (`text`) processing
    const processCode = (text: string) => {
      // First process bold, then code (simplistic approach)
      // Actually simpler to split by backticks first
      const parts = text.split(/(`.*?`)/g);
      return parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={idx} style={{ background: "rgba(0,0,0,0.1)", padding: "2px 4px", borderRadius: 4, fontFamily: "monospace" }}>{part.slice(1, -1)}</code>;
        }
        return processBold(part); // Recursively handle bold outside code
      });
    };

    const trimLine = line.trim();

    // Check for Unordered List: "- Item" or "* Item"
    if (trimLine.startsWith("- ") || trimLine.startsWith("* ")) {
      if (isOrdered && currentList.length > 0) {
        // Flush previous ordered list
        elements.push(<ol key={`ol-${i}`}>{currentList}</ol>);
        currentList = [];
      }
      isOrdered = false;
      currentList.push(
        <li key={`li-${i}`}>{processCode(trimLine.substring(2))}</li>
      );
    }
    // Check for Ordered List: "1. Item"
    else if (/^\d+\.\s/.test(trimLine)) {
      if (!isOrdered && currentList.length > 0) {
        // Flush previous unordered list
        elements.push(<ul key={`ul-${i}`}>{currentList}</ul>);
        currentList = [];
      }
      isOrdered = true;
      // Remove "1. " from start
      const text = trimLine.replace(/^\d+\.\s/, "");
      currentList.push(
        <li key={`li-${i}`}>{processCode(text)}</li>
      );
    }
    else {
      // Flush any active list
      if (currentList.length > 0) {
        if (isOrdered) elements.push(<ol key={`ol-${i}`}>{currentList}</ol>);
        else elements.push(<ul key={`ul-${i}`}>{currentList}</ul>);
        currentList = [];
        isOrdered = false;
      }

      // Regular paragraph
      if (trimLine) {
        elements.push(
          <p key={`p-${i}`} style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
            {processCode(line)}
          </p>
        );
      } else {
        // Preserve empty lines as spacers
        elements.push(<div key={`br-${i}`} style={{ height: 10 }}></div>);
      }
    }
  });

  // Flush remaining list at the end
  if (currentList.length > 0) {
    if (isOrdered) elements.push(<ol key="ol-end">{currentList}</ol>);
    else elements.push(<ul key="ul-end">{currentList}</ul>);
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
  const [showSources, setShowSources] = React.useState(false);

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
              {confidence.toUpperCase()}
            </span>

            {/* Sources Toggle Button */}
            {message.meta.sources && message.meta.sources.length > 0 && (
              <div className="sources-container" style={{ display: "inline-block" }}>
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="source-toggle-btn"
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    background: "rgba(59, 130, 246, 0.15)", // Blue tint like 'status'
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    color: "#93c5fd",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s"
                  }}
                  title="Click to view sources"
                >
                  <span style={{ fontSize: "1rem" }}>📄</span>
                  {message.meta.sources.length} Sources
                  <span style={{
                    fontSize: "0.7rem",
                    transform: showSources ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}>▼</span>
                </button>

                {/* Expanded Source List */}
                {showSources && (
                  <div className="source-list-expanded" style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    animation: "fadeIn 0.2s ease-out"
                  }}>
                    {message.meta.sources.map((src, i) => (
                      <a
                        key={i}
                        href="#" // In a real app, this would be a link to the doc
                        className="source-item-row"
                        style={{
                          display: "block",
                          padding: "6px 10px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 6,
                          color: "var(--text-secondary)",
                          fontSize: "0.8rem",
                          textDecoration: "none",
                          border: "1px solid rgba(255,255,255,0.05)",
                          transition: "background 0.2s"
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        📄 {src.split("/").pop()}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

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
