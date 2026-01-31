from typing import List, Literal

ConfidenceLevel = Literal["high", "medium", "low"]

class GoldenQuestion:
    question_id: str
    query: str
    expected_sources: List[str]
    required_confidence: ConfidenceLevel
    min_confidence_score: float
    category: str
