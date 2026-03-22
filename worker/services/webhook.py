"""
Webhook callback service.
Sends processing results back to the Next.js API.
"""

import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
WEBHOOK_SECRET = os.getenv("WORKER_WEBHOOK_SECRET", "")


async def send_callback(
    release_id: str,
    media_asset_id: str,
    status: str,
    audio_data: dict | None = None,
    video_data: dict | None = None,
    feature_vector: list[float] | None = None,
    duration_ms: int | None = None,
) -> bool:
    """
    Send processing results to the Next.js webhook endpoint.
    Returns True on success, False on failure.
    """
    payload = {
        "release_id": release_id,
        "media_asset_id": media_asset_id,
        "status": status,
    }

    if audio_data:
        payload["audio"] = audio_data
    if video_data:
        payload["video"] = video_data
    if feature_vector:
        payload["feature_vector"] = feature_vector
    if duration_ms is not None:
        payload["duration_ms"] = duration_ms

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{NEXTJS_URL}/api/webhooks/worker-callback",
                headers={"X-Webhook-Secret": WEBHOOK_SECRET},
                json=payload,
            )
            response.raise_for_status()
            logger.info(f"Webhook callback sent for release {release_id}: {status}")
            return True
    except httpx.HTTPError as e:
        logger.error(f"Webhook callback failed for release {release_id}: {e}")
        return False
