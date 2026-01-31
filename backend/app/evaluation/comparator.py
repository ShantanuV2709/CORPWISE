from typing import List, Literal, Dict


ConfidenceLabel = Literal["high", "medium", "low"]


def evaluate_result(
    expected_sources: List[str],
    retrieved_sources: List[str],
    confidence_score: float,
    confidence_label: ConfidenceLabel,
    min_confidence_score: float,
    required_confidence: ConfidenceLabel
) -> Dict:
    """
    Compare expected sources vs retrieved sources and
    validate confidence requirements.

    Returns a deterministic pass/fail verdict with reasons.
    """

    expected_set = set(expected_sources)
    retrieved_set = set(retrieved_sources)

    # Source comparison
    missing_sources = list(expected_set - retrieved_set)
    unexpected_sources = list(retrieved_set - expected_set)

    # Confidence checks
    confidence_score_ok = confidence_score >= min_confidence_score
    confidence_label_ok = confidence_label == required_confidence

    # Core pass/fail logic
    passed = True

    # If expected sources exist, at least one must be retrieved
    if expected_set and not (expected_set & retrieved_set):
        passed = False

    # No unexpected (hallucinated) sources allowed
    if unexpected_sources:
        passed = False

    # Confidence score must meet minimum
    if not confidence_score_ok:
        passed = False

    # Confidence label must match required
    if not confidence_label_ok:
        passed = False

    return {
        "passed": passed,
        "missing_sources": missing_sources,
        "unexpected_sources": unexpected_sources,
        "confidence_score_ok": confidence_score_ok,
        "confidence_label_ok": confidence_label_ok
    }
