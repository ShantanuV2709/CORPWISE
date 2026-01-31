import os
from dotenv import load_dotenv
from google import genai
from tenacity import retry, retry_if_exception, stop_after_attempt

# Load environment variables
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set")

client = genai.Client(api_key=API_KEY)

MODEL_NAME = "models/gemini-2.5-flash"


def is_rate_limit_error(exception: Exception) -> bool:
    """
    Detect Gemini 429 quota errors WITHOUT relying on internal SDK classes.
    """
    # Case 1: exception has status_code attribute
    if hasattr(exception, "status_code") and exception.status_code == 429:
        return True

    # Case 2: message contains quota / 429 hints
    msg = str(exception).lower()
    if "429" in msg or "resource_exhausted" in msg or "quota" in msg:
        return True

    return False


def should_retry(exception: Exception) -> bool:
    """
    Retry only if NOT a rate-limit error.
    """
    return not is_rate_limit_error(exception)


@retry(
    retry=retry_if_exception(should_retry),
    stop=stop_after_attempt(2),  # keep retries minimal
)
def generate_gemini_response(prompt: str) -> str:
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    return response.text
