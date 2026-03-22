"""
Cloudflare R2 storage service.
Uses boto3 with S3-compatible API for upload/download from R2.
"""

import os
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()


def get_r2_client():
    """Create a boto3 S3 client configured for Cloudflare R2."""
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
        aws_access_key_id=os.getenv("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("R2_SECRET_ACCESS_KEY"),
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


BUCKET = os.getenv("R2_BUCKET_NAME", "dynamics-media")


def download_from_r2(key: str, local_path: str) -> str:
    """Download a file from R2 to local storage."""
    client = get_r2_client()
    client.download_file(BUCKET, key, local_path)
    return local_path


def upload_to_r2(local_path: str, key: str, content_type: str = "application/octet-stream") -> str:
    """Upload a file to R2 and return the public URL."""
    client = get_r2_client()
    client.upload_file(
        local_path, 
        BUCKET, 
        key,
        ExtraArgs={"ContentType": content_type},
    )
    public_url = os.getenv("R2_PUBLIC_URL", "")
    return f"{public_url}/{key}"


def list_objects(prefix: str) -> list[str]:
    """List object keys in R2 under a given prefix."""
    client = get_r2_client()
    response = client.list_objects_v2(Bucket=BUCKET, Prefix=prefix)
    return [obj["Key"] for obj in response.get("Contents", [])]
