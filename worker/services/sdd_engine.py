"""
Spectral Density Discount (SDD) Engine.
The core proprietary algorithm for Dynamics.art.

Formula: LUFS_adjusted = LUFS_raw - (α × F_mean)
Where:
  - LUFS_raw: Integrated loudness measured by pyloudnorm
  - F_mean: Mean spectral flatness measured by librosa
  - α: Tunable discount constant (default 10.0)

Higher spectral flatness → complex tonal music → larger discount → louder playback.
Lower spectral flatness → compressed/noise-like audio → minimal discount → turned down.

NO LIMITERS. NO COMPRESSORS. Just math.
"""

import pyloudnorm as pyln
import soundfile as sf
import librosa
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Tunable constants
ALPHA = 10.0  # SDD discount weight
TARGET_LUFS = -14.0  # Industry standard loudness target


def analyze_loudness(audio_path: str) -> float:
    """
    Calculate integrated LUFS_raw using pyloudnorm.
    Returns the raw integrated loudness in LUFS.
    """
    data, rate = sf.read(audio_path)
    meter = pyln.Meter(rate)
    lufs_raw = meter.integrated_loudness(data)
    logger.info(f"LUFS_raw: {lufs_raw:.2f} dB")
    return float(lufs_raw)


def analyze_spectral_flatness(audio_path: str) -> float:
    """
    Calculate mean spectral flatness using librosa.
    Returns F_mean (0.0 = tonal/harmonic, 1.0 = noise/flat spectrum).
    """
    y, sr = librosa.load(audio_path, sr=None)
    spectral_flat = librosa.feature.spectral_flatness(y=y)
    f_mean = float(np.mean(spectral_flat))
    logger.info(f"Spectral flatness (F_mean): {f_mean:.6f}")
    return f_mean


def calculate_sdd_offset(lufs_raw: float, f_mean: float) -> float:
    """
    Apply the Spectral Density Discount formula.
    
    LUFS_adjusted = LUFS_raw - (α × F_mean)
    gain_offset_db = TARGET_LUFS - LUFS_adjusted
    
    Complex music (high F_mean) gets a larger discount → louder playback.
    Compressed audio (low F_mean) gets minimal discount → turned down.
    """
    lufs_adjusted = lufs_raw - (ALPHA * f_mean)
    gain_offset_db = TARGET_LUFS - lufs_adjusted
    logger.info(
        f"SDD: LUFS_raw={lufs_raw:.2f}, F_mean={f_mean:.6f}, "
        f"LUFS_adjusted={lufs_adjusted:.2f}, gain_offset_db={gain_offset_db:.2f}"
    )
    return float(gain_offset_db)


def run_sdd_analysis(audio_path: str) -> dict:
    """
    Run the complete SDD analysis pipeline.
    Returns all acoustic measurements and the calculated gain offset.
    """
    lufs_raw = analyze_loudness(audio_path)
    f_mean = analyze_spectral_flatness(audio_path)
    gain_offset_db = calculate_sdd_offset(lufs_raw, f_mean)

    return {
        "lufs_raw": lufs_raw,
        "spectral_flatness": f_mean,
        "gain_offset_db": gain_offset_db,
    }
