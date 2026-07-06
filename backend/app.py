from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging

from model import generate_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sid.ai")

app = FastAPI(title="sid.ai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"status": "sid.ai is running"}


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        answer = await asyncio.to_thread(generate_response, request.message)
        return {"response": answer}
    except Exception as e:
        logger.exception("Inference failed")
        return {"error": str(e), "response": "Sorry, I encountered an error while generating a response."}
