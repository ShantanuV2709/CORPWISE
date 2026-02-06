import React, { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { MessageBubble } from "./MessageBubble";
import SystemProcessing from "./SystemProcessing";
import DecryptedText from "./DecryptedText";

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use the shared hook
    const {
        messages,
        loading,
        input,
        setInput,
        sendMessage,
        startNewChat
    } = useChat();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="widget-container">
            {/* 1. The Popover Window */}
            <div className={`widget-window ${isOpen ? "open" : "closed"}`}>
                {/* Header */}
                <div className="widget-header">
                    <div className="widget-brand">
                        <div className="status-dot"></div>
                        <DecryptedText
                            key={isOpen.toString()} // Force restart animation on open
                            text="CORPWISE ASSISTANT"
                            speed={80}
                            animateOn="view"
                            className="widget-title-revealed"
                            encryptedClassName="encrypted"
                        />
                    </div>
                    <button className="widget-refresh-btn" onClick={startNewChat} title="New Chat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6" />
                            <path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="widget-messages">
                    {messages.length === 0 && (
                        <div className="widget-empty-state">
                            <DecryptedText
                                text="How can I help you today?"
                                className="widget-welcome revealed"
                                encryptedClassName="encrypted"
                                speed={50}
                                animateOn="view" // re-run when opened
                            />
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <MessageBubble
                            key={i}
                            message={m}
                            conversationId="widget"
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

                {/* Input */}
                <div className="widget-input-area">
                    <input
                        className="widget-input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                        placeholder="Ask Corpwise..."
                        autoFocus
                    />
                    <button
                        className="widget-send-btn"
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || loading}
                    >
                        ➤
                    </button>
                </div>
            </div>

            {/* 2. The Launcher Button (FAB) */}
            <button
                className={`widget-launcher ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? "✕" : "💬"}
            </button>
        </div>
    );
}
