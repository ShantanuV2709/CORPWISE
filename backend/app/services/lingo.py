import os
import httpx

LINGO_API_KEY = os.getenv("LINGO_API_KEY")
LINGO_BASE_URL = "https://api.lingo.dev/v1"

async def translate(text: str, target_lang: str) -> str:
    if target_lang.lower() == "en":
        return text

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{LINGO_BASE_URL}/translate",
            headers={
                "Authorization": f"Bearer {LINGO_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "text": text,
                "target_language": target_lang,
            },
            timeout=10,
        )

        res.raise_for_status()
        return res.json()["translated_text"]
