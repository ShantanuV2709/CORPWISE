import re

MAX_SENTENCES = 3

def compress_chunk(text: str) -> str:
    """
    Rule-based context compression.
    Keeps only the most informative sentences.
    """

    # If text is short, return as is
    if len(text.split()) < 150:
        return text.strip()
    
    # ⚠️ DISABLED heuristics for now.
    # The previous logic was aggressively removing list items (like steps 2, 3, 4).
    # For RAG, it's better to return the full 400-token chunk than to slice it incorrectly.
    return text.strip()
