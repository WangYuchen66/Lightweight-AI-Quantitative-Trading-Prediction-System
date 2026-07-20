from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.sentiment import llm_analyze


ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT = ROOT / "src" / "data" / "snapshot.json"

app = FastAPI(title="NEXUS Alpha API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class NewsRequest(BaseModel):
    text: str = Field(min_length=3, max_length=5000)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nexus-alpha"}


@app.get("/api/snapshot")
def snapshot() -> dict:
    if not SNAPSHOT.exists():
        raise HTTPException(status_code=503, detail="Run backend/generate_snapshot.py first")
    return json.loads(SNAPSHOT.read_text(encoding="utf-8"))


@app.post("/api/analyze-news")
def analyze_news(request: NewsRequest) -> dict:
    return llm_analyze(request.text).__dict__

