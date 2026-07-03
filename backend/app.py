from fastapi import FastAPI
from pydantic import BaseModel

from model import generate_response

app = FastAPI(title="sid.ai API")


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def root():
    return {"status": "sid.ai is running"}


@app.post("/chat")
def chat(request: ChatRequest):

    answer = generate_response(request.message)

    return {
        "response": answer
    }