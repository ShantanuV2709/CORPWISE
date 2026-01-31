from app.services.llm import ask_llm

async def llm_rerank_context(
    question: str,
    contexts: list[str],
    top_n: int = 2
) -> list[str]:
    """
    Uses Gemini to select the most relevant context chunks
    """

    if not contexts:
        return []

    joined_contexts = "\n\n".join(
        f"[{i}] {ctx}" for i, ctx in enumerate(contexts)
    )

    prompt = f"""
You are an AI assistant helping with document retrieval.

Question:
{question}

Context chunks:
{joined_contexts}

Task:
Select the {top_n} most relevant chunks that best help answer the question.
Return ONLY the indices as a comma-separated list.
"""

    response = await ask_llm(prompt)

    try:
        indices = [int(i.strip()) for i in response.split(",")]
        return [contexts[i] for i in indices if i < len(contexts)]
    except Exception:
        # Fallback: return first N
        return contexts[:top_n]
