"""
FFmpeg pipeline for splitting, encoding, and HLS generation.
Handles the "Split Pipeline" — decoupling audio from video.
"""

import subprocess
import os
import logging

logger = logging.getLogger(__name__)


def split_audio_video(input_path: str, output_dir: str) -> dict:
    """
    Split an input media file into separate audio and video tracks.
    Returns paths to the separated files.
    """
    audio_out = os.path.join(output_dir, "raw_audio.wav")
    video_out = os.path.join(output_dir, "raw_video.mp4")
    
    result = {"audio": None, "video": None}

    # Extract audio (24-bit PCM WAV)
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-vn", "-acodec", "pcm_s24le", audio_out,
            ],
            check=True,
            capture_output=True,
            text=True,
        )
        result["audio"] = audio_out
        logger.info(f"Audio extracted: {audio_out}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Audio extraction failed: {e.stderr}")
        raise

    # Extract video (if present — audio-only uploads skip this)
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-count_packets", "-show_entries", "stream=nb_read_packets",
             "-of", "csv=p=0", input_path],
            capture_output=True, text=True,
        )
        has_video = probe.stdout.strip() and int(probe.stdout.strip()) > 0
    except (subprocess.CalledProcessError, ValueError):
        has_video = False

    if has_video:
        try:
            subprocess.run(
                [
                    "ffmpeg", "-y", "-i", input_path,
                    "-an", "-c:v", "copy", video_out,
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            result["video"] = video_out
            logger.info(f"Video extracted: {video_out}")
        except subprocess.CalledProcessError as e:
            logger.warning(f"Video extraction failed (audio-only file?): {e.stderr}")

    return result


def encode_flac(input_wav: str, output_dir: str) -> str:
    """Encode raw WAV to 24-bit FLAC (lossless, premium tier)."""
    output_path = os.path.join(output_dir, "master.flac")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", input_wav,
            "-c:a", "flac", "-sample_fmt", "s32",
            output_path,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    logger.info(f"FLAC encoded: {output_path}")
    return output_path


def encode_opus(input_wav: str, output_dir: str) -> str:
    """Encode raw WAV to 320kbps Opus (transparent, standard tier)."""
    output_path = os.path.join(output_dir, "stream.opus")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", input_wav,
            "-c:a", "libopus", "-b:a", "320k",
            output_path,
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    logger.info(f"Opus encoded: {output_path}")
    return output_path


def generate_hls(input_video: str, output_dir: str) -> str:
    """
    Generate adaptive bitrate HLS manifest with 1080p, 720p, 480p tiers.
    Returns path to the master manifest.
    """
    hls_dir = os.path.join(output_dir, "hls")
    os.makedirs(hls_dir, exist_ok=True)
    
    # Create subdirectories for each tier
    for tier in ["1080p", "720p", "480p"]:
        os.makedirs(os.path.join(hls_dir, tier), exist_ok=True)

    master_playlist = os.path.join(hls_dir, "master.m3u8")

    subprocess.run(
        [
            "ffmpeg", "-y", "-i", input_video,
            "-filter_complex",
            "[0:v]split=3[v1][v2][v3];"
            "[v1]scale=1920:1080[v1out];"
            "[v2]scale=1280:720[v2out];"
            "[v3]scale=854:480[v3out]",
            "-map", "[v1out]", "-c:v:0", "libx264", "-b:v:0", "5M",
            "-map", "[v2out]", "-c:v:1", "libx264", "-b:v:1", "3M",
            "-map", "[v3out]", "-c:v:2", "libx264", "-b:v:2", "1M",
            "-f", "hls",
            "-hls_time", "6",
            "-hls_list_size", "0",
            "-master_pl_name", "master.m3u8",
            "-var_stream_map", "v:0 v:1 v:2",
            os.path.join(hls_dir, "%v/stream.m3u8"),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    logger.info(f"HLS generated: {master_playlist}")
    return hls_dir


def get_duration_ms(input_path: str) -> int:
    """Get the duration of a media file in milliseconds."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "csv=p=0",
            input_path,
        ],
        capture_output=True,
        text=True,
    )
    duration_seconds = float(result.stdout.strip())
    return int(duration_seconds * 1000)
