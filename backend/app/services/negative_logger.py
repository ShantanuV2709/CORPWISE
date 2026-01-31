from datetime import datetime
from app.db.mongodb import db


async def log_negative_retrieval(
    question: str,
    confidence: str,
    answer_conf_score: float,
    ce_used: bool,
    top_ce_score: float | None,
    sources: list[str],
):
    # --------------------
    # Determine missing reason
    # --------------------
    if not sources:
        missing_reason = "no_documents"
    elif not ce_used:
        missing_reason = "weak_retrieval"
    elif confidence != "high":
        missing_reason = "insufficient_depth"
    else:
        return  # Do not log positives

    await db.negative_retrieval_logs.insert_one({
        "question": question,
        "confidence": confidence,
        "answer_conf_score": round(answer_conf_score, 3),
        "ce_used": ce_used,
        "top_ce_score": top_ce_score,
        "sources": sources,
        "missing_reason": missing_reason,
        "timestamp": datetime.utcnow()
    })
