import re

MAX_SENTENCES = 3

def compress_chunk(text: str) -> str:
    """
    Rule-based context compression.
    Keeps only the most informative sentences.
    """

    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)

    if len(sentences) <= MAX_SENTENCES:
        return text.strip()

    # Heuristic scoring
    scored = []
    for s in sentences:
        score = 0
        s_lower = s.lower()

        if any(k in s_lower for k in [
            "uses", "is used", "combines", "applies",
            "retrieval", "semantic", "keyword",
            "cross-encoder", "normalized", "weighted",
            "stored", "managed", "lifecycle"
        ]):
            score += 2

        if len(s.split()) > 12:
            score += 1

        scored.append((score, s))

    # Select top sentences
    scored.sort(reverse=True, key=lambda x: x[0])
    selected = [s for _, s in scored[:MAX_SENTENCES]]

    return " ".join(selected).strip()
