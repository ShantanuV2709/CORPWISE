from app.services.llm.gemini_client import generate_gemini_response

def ask_llm(prompt: str) -> str:
    return generate_gemini_response(prompt)
