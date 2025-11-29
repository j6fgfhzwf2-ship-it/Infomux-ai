# backend/app/main.py
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import httpx
import asyncio
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restreindre en prod
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_BASE = "http://localhost:11434/api"  # si Ollama local
# si Ollama cloud: "https://ollama.com/api" + clé si besoin

async def imagefile_to_b64(file: UploadFile) -> str:
    content = await file.read()
    return base64.b64encode(content).decode("utf-8")

class ChatResponse(BaseModel):
    text: str

@app.post("/chat", response_model=ChatResponse)
async def chat_with_images(
    question: str = Form(...),
    model: str = Form("llava:7b"),
    images: List[UploadFile] = File(None),
):
    images_b64 = []
    if images:
        tasks = [imagefile_to_b64(img) for img in images]
        images_b64 = await asyncio.gather(*tasks)

    # Build the payload according to Ollama generate API
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": question}
        ],
        "stream": False
    }
    if images_b64:
        payload["images"] = images_b64  # Ollama accepte un tableau base64
    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(f"{OLLAMA_BASE}/generate", json=payload)
        r.raise_for_status()
        data = r.json()
    # Ollama renvoie la réponse finale en data['choices'] ou data['message'] selon version
    # Here we attempt to extract a textual result robustly:
    text = None
    if "message" in data and isinstance(data["message"], dict):
        text = data["message"].get("content", "")
    elif "choices" in data and data["choices"]:
        text = "".join(c.get("delta", {}).get("content", "") or c.get("message", {}).get("content", "") or "" for c in data["choices"])
    else:
        text = str(data)
    return {"text": text}

