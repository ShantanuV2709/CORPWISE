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

MODEL_NAME = "models/gemini-2.5-flash-lite"


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


from tenacity import retry, stop_after_attempt, wait_exponential

# ... (imports)

def generate_gemini_response(prompt: str) -> str:
    """
    Generates content with robust error handling for Rate Limits.
    """
    try:
        return _generate_with_retry(prompt)
    except Exception as e:
        print(f"❌ Gemini Generation Failed: {e}")
        return ""

@retry(
    wait=wait_exponential(multiplier=2, min=5, max=60), # Wait 5s, 10s, 20s, 40s...
    stop=stop_after_attempt(5), # Try 5 times (enough to cover the ~18s delay)
    reraise=True 
)
def _generate_with_retry(prompt: str) -> str:
    # Print a small debug dot to show activity in logs without spamming
    print(".", end="", flush=True)
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt
    )
    return response.text if response.text else ""
