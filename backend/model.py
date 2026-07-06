import httpx
import logging

LLAMA_SERVER_URL = "http://127.0.0.1:8081/v1/chat/completions"
logger = logging.getLogger("sid.ai")


def generate_response(prompt: str):
    messages = [
        {
            "role": "system",
            "content": (
                "You are sid.ai, an intelligent AI assistant created by Siddiq Mohamed. "
                "Be helpful, accurate, professional, and concise."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    payload = {
        "messages": messages,
        "max_tokens": 512,
        "temperature": 0.7,
        "top_p": 0.9,
        "stream": False,
    }
    try:
        with httpx.Client(timeout=300) as client:
            resp = client.post(LLAMA_SERVER_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.exception("llama-server call failed")
        return f"Error: {e}"
