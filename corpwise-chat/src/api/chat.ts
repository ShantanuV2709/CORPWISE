import { ChatResponse } from "../types/chat";

const API_BASE = "http://localhost:8001";

export async function sendQuery(
  userId: string,
  conversationId: string,
  query: string,
  companyId?: string // Added optional companyId
): Promise<ChatResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Fallback: If companyId is not passed, default to "silaibook" during this beta testing phase
  const targetCompany = companyId || "silaibook";

  console.log(`[API] Sending Query. Company: ${targetCompany}, Query: ${query}`);

  if (targetCompany) {
    headers["X-Company-ID"] = targetCompany;
  }

  // Multi-User Support: Send User ID in header
  if (userId) {
    headers["X-User-ID"] = userId;
  }

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({
      user_id: userId,
      conversation_id: conversationId,
      question: query
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat request failed: ${err}`);
  }

  return res.json();
}

export async function getHistory(userId: string) {
  // Use header-based auth for history
  const headers: Record<string, string> = {};
  if (userId) {
    headers["X-User-ID"] = userId;
  }

  const res = await fetch(`${API_BASE}/conversations/history`, {
    method: "GET",
    headers: headers
  });

  if (!res.ok) throw new Error("Failed to fetch history");
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
