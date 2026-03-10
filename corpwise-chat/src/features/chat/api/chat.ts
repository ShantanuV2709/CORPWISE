import { ChatResponse } from "../../../types/chat";

const API_BASE = "http://localhost:8001";
const IS_DEV = process.env.NODE_ENV !== "production";

export async function sendQuery(
  userId: string,
  conversationId: string,
  query: string,
  companyId?: string // Added optional companyId
): Promise<ChatResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Fallback: If companyId is not passed, read from window config
  const targetCompany = companyId || (window as any).CORPWISE_COMPANY_ID || "";

  if (IS_DEV) {
    console.debug(`[API] Sending query for company: ${targetCompany || "<none>"}`);
  }

  if (targetCompany) {
    headers["X-Company-ID"] = targetCompany;
  }

  // Multi-User Support: Send User ID in header
  if (userId) {
    headers["X-User-ID"] = userId;
  }

  // 🔐 API Key — resolved in priority order:
  // 1. window.CORPWISE_API_KEY (set in index.html — works in any browser)
  // 2. localStorage 'corpwise_api_key' (set when admin clicks Copy in API Keys tab)
  const windowApiKey = (window as any).CORPWISE_API_KEY as string | undefined;
  const storedApiKey = localStorage.getItem('corpwise_api_key');
  const resolvedApiKey = windowApiKey || storedApiKey;
  if (resolvedApiKey) {
    headers["X-API-Key"] = resolvedApiKey;
  } else if (IS_DEV) {
    console.warn("[API] No API Key found. Set window.CORPWISE_API_KEY or localStorage.corpwise_api_key.");
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
