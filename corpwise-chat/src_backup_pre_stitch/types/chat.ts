export interface ChatResponse {
  reply: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
  cached: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: ChatResponse;
}
