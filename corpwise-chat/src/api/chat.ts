import { ChatResponse } from "../types/chat";

const API_BASE = "http://localhost:8000";

export async function sendQuery(
  conversationId: string,
  query: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: conversationId,   // ✅ FIXED
      question: query            // ✅ FIXED
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat request failed: ${err}`);
  }

  return res.json();
}

export async function sendFeedback(
  conversationId: string,
  helpful: boolean,
  reason?: string
) {
  await fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      helpful,
      reason
    })
  });
}
