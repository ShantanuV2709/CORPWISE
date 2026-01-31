def detect_intent(question: str) -> str:
    q = question.lower().strip()

    if q.startswith((
        "what is",
        "explain",
        "describe",
        "how does",
        "how do",
        "what are",
    )):
        return "EXPLANATION"

    if q.startswith(("when", "how long")):
        return "FACT"

    return "GENERAL"
