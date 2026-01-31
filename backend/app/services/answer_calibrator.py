import re

def calibrate_answer(
    answer_text: str,
    context: str,
    answer_conf_score: float
) -> tuple[str, str]:
    """
    Adjusts answer wording and confidence based on
    retrieval strength and answer quality.
    """

    answer_lower = answer_text.lower()
    context_lower = context.lower()

    # Heuristic signals
    vague_phrases = [
        "it depends",
        "generally",
        "in some cases",
        "various",
        "typically"
    ]

    vague_count = sum(p in answer_lower for p in vague_phrases)

    context_overlap = len(
        set(answer_lower.split()) &
        set(context_lower.split())
    )

    # Calibration rules
    if answer_conf_score >= 0.75 and context_overlap > 12:
        return answer_text, "high"

    if answer_conf_score >= 0.45:
        calibrated = (
            "Based on the available internal documentation:\n\n"
            + answer_text
        )
        return calibrated, "medium"

    calibrated = (
        "The available internal documentation provides limited information.\n\n"
        + answer_text
    )
    return calibrated, "low"
