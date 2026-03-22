"""
DSP Job processing routes.
Receives job requests from the Next.js API and processes audio/video files.
"""

import os
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/jobs", tags=["jobs"])

WEBHOOK_SECRET = os.getenv("WORKER_WEBHOOK_SECRET", "")


class AuxKeys(BaseModel):
    midi: Optional[str] = None
    musicxml: Optional[str] = None
    webvtt: Optional[str] = None
    srt: Optional[str] = None


class DspJobRequest(BaseModel):
    releaseId: str
    mediaAssetId: str
    audioKey: Optional[str] = None
    videoKey: Optional[str] = None
    auxKeys: Optional[AuxKeys] = None


@router.post("/process")
async def process_job(
    job: DspJobRequest,
    x_webhook_secret: str = Header(..., alias="X-Webhook-Secret"),
):
    """
    Receive a DSP processing job from the Next.js API.
    Validates the webhook secret before processing.
    """
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    # TODO: Implement full DSP pipeline in Phase 4
    # For now, acknowledge the job
    return {
        "status": "accepted",
        "release_id": job.releaseId,
        "media_asset_id": job.mediaAssetId,
    }
