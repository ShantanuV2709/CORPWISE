import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendQuery, getHistory } from "../api/chat";
import { Message } from "../types/chat";

export interface ConversationSummary {
    conversation_id: string;
    title: string;
    updated_at: string;
    messages?: Message[];
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState("");

    // Default to silaibook for now, or could come from props/context
    const [companyId, setCompanyId] = useState("silaibook");

    // Persistent User ID
    const [userId] = useState(() => {
        let stored = localStorage.getItem("app_user_id");
        if (!stored) {
            stored = uuidv4();
            localStorage.setItem("app_user_id", stored);
        }
        return stored;
    });

    // Current active conversation
    const [conversationId, setConversationId] = useState<string>(() => uuidv4());

    // History list
    const [history, setHistory] = useState<ConversationSummary[]>([]);

    // Load history helper
    const loadHistory = useCallback(async () => {
        try {
            const data = await getHistory(userId);
            const sorted = data.sort((a: any, b: any) =>
                new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
            );
            setHistory(sorted);
        } catch (err) {
            console.error("Failed to load history", err);
        }
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const startNewChat = useCallback(() => {
        setConversationId(uuidv4());
        setMessages([]);
    }, []);

    const loadConversation = useCallback((conv: ConversationSummary) => {
        setConversationId(conv.conversation_id);
        if (conv.messages) {
            setMessages(conv.messages);
        } else {
            setMessages([]);
        }
    }, []);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            role: "user",
            content: text
        };

        setMessages(prev => [...prev, userMessage]);
        setInput(""); // Clear input if managed here, but often better managed by UI
        setLoading(true);

        try {
            // Pass companyId to API
            const response = await sendQuery(userId, conversationId, text, companyId);

            const assistantMessage: Message = {
                role: "assistant",
                content: response.reply,
                meta: response
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Refresh history to show new title
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
    };

    return {
        userId,
        conversationId,
        messages,
        loading,
        input,
        setInput,
        history,
        startNewChat,
        loadConversation,
        sendMessage,
        loadHistory,
        companyId,      // Export these if needed by UI
        setCompanyId
    };
}
