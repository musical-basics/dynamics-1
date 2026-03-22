"""
DSP Job processing routes.
Receives job requests from the Next.js API and processes audio/video files.
Orchestrates the full Split Pipeline:
  1. Download raw uploads from R2
  2. Split audio/video via FFmpeg
  3. Run SDD analysis (LUFS, spectral flatness, gain offset)
  4. Encode FLAC + Opus
  5. Generate HLS (if video present)
  6. Extract feature vector
  7. Upload processed files to R2
  8. Send webhook callback to Next.js
  9. Cleanup temp files
"""

import os
import shutil
import tempfile
import logging
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

from services.r2 import download_from_r2, upload_to_r2, list_objects
from services.ffmpeg_pipeline import (
    split_audio_video,
    encode_flac,
    encode_opus,
    generate_hls,
    get_duration_ms,
)
from services.sdd_engine import run_sdd_analysis
from services.feature_extractor import extract_features
from services.webhook import send_callback

load_dotenv()

router = APIRouter(prefix="/jobs", tags=["jobs"])
logger = logging.getLogger(__name__)

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


async def process_pipeline(job: DspJobRequest):
    """
    Full DSP processing pipeline. Runs as a background task.
    """
    temp_dir = tempfile.mkdtemp(prefix="dynamics_dsp_")
    logger.info(f"Starting DSP pipeline for release {job.releaseId} in {temp_dir}")

    try:
        # Step 31: Download raw uploads from R2
        input_files = []
        if job.audioKey:
            # List all files under the upload prefix
            keys = list_objects(job.audioKey)
            for key in keys:
                filename = os.path.basename(key)
                local_path = os.path.join(temp_dir, filename)
                download_from_r2(key, local_path)
                input_files.append(local_path)

        if not input_files:
            raise RuntimeError("No input files found in R2")

        # Find the primary audio/video file
        primary_input = input_files[0]
        for f in input_files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ('.wav', '.flac', '.aiff', '.aif', '.mp4', '.mov'):
                primary_input = f
                break

        # Step 32: Split audio/video
        split_result = split_audio_video(primary_input, temp_dir)
        raw_audio = split_result["audio"]
        raw_video = split_result.get("video")

        if not raw_audio:
            raise RuntimeError("Audio extraction failed")

        # Get duration
        duration_ms = get_duration_ms(raw_audio)

        # Steps 33-36: SDD Analysis
        sdd_result = run_sdd_analysis(raw_audio)

        # Step 37: Premium Tier Encoding (FLAC)
        encode_dir = os.path.join(temp_dir, "encoded")
        os.makedirs(encode_dir, exist_ok=True)
        flac_path = encode_flac(raw_audio, encode_dir)

        # Step 38: Standard Tier Encoding (Opus)
        opus_path = encode_opus(raw_audio, encode_dir)

        # Step 40: Feature Extraction
        features = extract_features(raw_audio)

        # Step 41: Upload to R2
        release_id = job.releaseId
        flac_key = f"media/{release_id}/audio/master.flac"
        opus_key = f"media/{release_id}/audio/stream.opus"
        flac_url = upload_to_r2(flac_path, flac_key, "audio/flac")
        opus_url = upload_to_r2(opus_path, opus_key, "audio/ogg")

        video_data = None
        hls_manifest_url = None

        # Step 39: Video Processing (HLS)
        if raw_video:
            hls_dir = generate_hls(raw_video, temp_dir)
            # Upload all HLS files
            for root, _, files in os.walk(hls_dir):
                for filename in files:
                    local_file = os.path.join(root, filename)
                    relative = os.path.relpath(local_file, hls_dir)
                    r2_key = f"media/{release_id}/video/{relative}"
                    content_type = "application/vnd.apple.mpegurl" if filename.endswith(".m3u8") else "video/mp2t"
                    upload_to_r2(local_file, r2_key, content_type)

            r2_public = os.getenv("R2_PUBLIC_URL", "")
            hls_manifest_url = f"{r2_public}/media/{release_id}/video/master.m3u8"
            video_data = {"hls_manifest_url": hls_manifest_url}

        # Step 42: Callback to Next.js
        audio_data = {
            **sdd_result,
            "flac_url": flac_url,
            "opus_url": opus_url,
            "tempo": features["tempo"],
            "key": features["key"],
        }

        await send_callback(
            release_id=job.releaseId,
            media_asset_id=job.mediaAssetId,
            status="ready",
            audio_data=audio_data,
            video_data=video_data,
            feature_vector=features["feature_vector"],
            duration_ms=duration_ms,
        )

        logger.info(f"Pipeline complete for release {job.releaseId}")

    except Exception as e:
        logger.error(f"Pipeline failed for release {job.releaseId}: {e}")
        # Send failure callback
        await send_callback(
            release_id=job.releaseId,
            media_asset_id=job.mediaAssetId,
            status="failed",
        )
    finally:
        # Step 45: Cleanup temp files
        shutil.rmtree(temp_dir, ignore_errors=True)
        logger.info(f"Cleaned up temp dir: {temp_dir}")


@router.post("/process")
async def process_job(
    job: DspJobRequest,
    background_tasks: BackgroundTasks,
    x_webhook_secret: str = Header(..., alias="X-Webhook-Secret"),
):
    """
    Receive a DSP processing job from the Next.js API.
    Validates the webhook secret and dispatches processing as a background task.
    """
    if x_webhook_secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")

    # Run the pipeline asynchronously
    background_tasks.add_task(process_pipeline, job)

    return {
        "status": "accepted",
        "release_id": job.releaseId,
        "media_asset_id": job.mediaAssetId,
    }
