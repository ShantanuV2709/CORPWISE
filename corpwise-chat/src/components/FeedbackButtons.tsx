import { useState } from "react";
import { sendFeedback } from "../api/chat";

export function FeedbackButtons({
  conversationId
}: {
  conversationId: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (
    helpful: boolean,
    reason: string
  ) => {
    if (submitted) return;

    try {
      await sendFeedback(conversationId, helpful, reason);
      setSubmitted(true);
    } catch {
      // Silently ignore feedback failures
      // (feedback must never break UX)
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        disabled={submitted}
        onClick={() =>
          handleFeedback(true, "accurate_sources")
        }
      >
        👍 Helpful
      </button>

      <button
        style={{ marginLeft: 8 }}
        disabled={submitted}
        onClick={() =>
          handleFeedback(false, "wrong_sources")
        }
      >
        👎 Not Helpful
      </button>

      {submitted && (
        <small style={{ marginLeft: 8, color: "green" }}>
          Thanks for your feedback
        </small>
      )}
    </div>
  );
}
