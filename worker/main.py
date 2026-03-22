"""
Dynamics.art — Python DSP Worker
FastAPI server for audio/video processing pipeline.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.jobs import router as jobs_router

app = FastAPI(
    title="Dynamics.art DSP Worker",
    description="Headless Python worker for audio analysis, encoding, and the SDD algorithm.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dynamics-dsp-worker"}

