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
              <span key={i} className="chip source" title={`Source: ${src}`}>
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
