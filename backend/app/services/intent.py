def detect_intent(question: str) -> str:
    q = question.lower().strip()

    # Greetings
    if q in ["hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"]:
        return "GREETING"

    # Date/Time checks
    # Expanded list to catch "what is the date", "time please", etc.
    dt_keywords = [
        "what time", "current time", "time is it", "time now",
        "today's date", "current date", "what is the date", "what's the date",
        "what day", "what is today", "current day"
    ]
    if any(x in q for x in dt_keywords):
        return "DATE_TIME"

    if "corpwise" in q or "who are you" in q or "what is this" in q or "purpose" in q:
        return "SYSTEM_INFO"

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
