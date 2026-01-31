def normalize_ce_score(ce_score: float) -> float:
    """
    Normalize MS-MARCO CE score (-10 to +10 approx) into [0,1]
    """
    return max(0.0, min((ce_score + 10) / 20, 1.0))


def compute_chunk_confidence(chunk: dict) -> float:
    """
    Combines retrieval + CE confidence
    """
    norm = chunk.get("norm_score", 0.0)
    ce = normalize_ce_score(chunk.get("ce_score", 0.0))

    # Weight CE slightly higher (semantic correctness)
    confidence = (0.4 * norm) + (0.6 * ce)
    return round(confidence, 3)

