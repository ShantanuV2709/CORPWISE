# app/services/cross_encoder_reranker.py

import time
import logging
from sentence_transformers import CrossEncoder

logger = logging.getLogger("corpwise.ce")

_ce_model = None

def get_ce_model():
    global _ce_model
    if _ce_model is None:
        _ce_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _ce_model


def cross_encoder_rerank(query: str, chunks: list, top_k: int = 3):
    """
    chunks: [{ text, source, type, score, norm_score }]
    """
    if not chunks:
        return []

    model = get_ce_model()

    pairs = [(query, c["text"]) for c in chunks]

    start = time.time()
    scores = model.predict(pairs)
    latency = round((time.time() - start) * 1000, 2)

    for chunk, ce_score in zip(chunks, scores):
        chunk["ce_score"] = float(ce_score)

    # Debug: pre vs post ordering
    pre_order = [(c["type"], round(c["norm_score"], 3)) for c in chunks]

    reranked = sorted(chunks, key=lambda x: x["ce_score"], reverse=True)

    post_order = [(c["type"], round(c["ce_score"], 3)) for c in reranked]

    logger.info(
        f"[CE] latency={latency}ms | "
        f"pre_norm={pre_order} | post_ce={post_order}"
    )

    return reranked[:top_k]

def get_ce_model():
    global _ce_model
    if _ce_model is None:
        logger.info("[CE] Loading cross-encoder model")
        _ce_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
    return _ce_model
