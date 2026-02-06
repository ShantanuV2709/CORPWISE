import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("No API Key found")
else:
    client = genai.Client(api_key=API_KEY)
    try:
        # Pager object, iterate to find models
        print("Listing models...")
        for m in client.models.list():
            print(f"- {m.name}")
    except Exception as e:
        print(f"Error: {e}")
