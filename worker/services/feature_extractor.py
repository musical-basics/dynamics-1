"""
Audio feature extraction for the recommendation engine.
Extracts tempo, chroma, MFCCs to build 128-dim feature vectors for pgvector.
"""

import librosa
import numpy as np
import logging

logger = logging.getLogger(__name__)

TARGET_VECTOR_DIM = 128


def extract_features(audio_path: str) -> dict:
    """
    Extract audio features for the recommendation engine.
    
    Returns:
        - feature_vector: 128-dim numpy array for pgvector cosine similarity
        - tempo: estimated tempo in BPM
        - key: estimated musical key
    """
    y, sr = librosa.load(audio_path, sr=None)

    # Tempo
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    tempo_val = float(np.atleast_1d(tempo)[0])

    # Chroma (12 coefficients)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)  # 12-dim

    # MFCCs (13 coefficients)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc, axis=1)  # 13-dim

    # Spectral contrast (7 coefficients)
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    contrast_mean = np.mean(spectral_contrast, axis=1)  # 7-dim

    # Tonnetz (6 coefficients)
    harmonic = librosa.effects.harmonic(y)
    tonnetz = librosa.feature.tonnetz(y=harmonic, sr=sr)
    tonnetz_mean = np.mean(tonnetz, axis=1)  # 6-dim

    # Zero crossing rate (1 value)
    zcr = librosa.feature.zero_crossing_rate(y)
    zcr_mean = float(np.mean(zcr))  # 1-dim

    # Spectral rolloff (1 value)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    rolloff_mean = float(np.mean(rolloff))  # 1-dim

    # Spectral bandwidth (1 value)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    bandwidth_mean = float(np.mean(bandwidth))  # 1-dim

    # RMS energy (1 value)
    rms = librosa.feature.rms(y=y)
    rms_mean = float(np.mean(rms))  # 1-dim

    # Concatenate all features
    raw_vector = np.concatenate([
        [tempo_val],         # 1
        chroma_mean,         # 12
        mfcc_mean,           # 13
        contrast_mean,       # 7
        tonnetz_mean,        # 6
        [zcr_mean],          # 1
        [rolloff_mean],      # 1
        [bandwidth_mean],    # 1
        [rms_mean],          # 1
    ])  # Total: 43 dims

    # Pad or truncate to target dimension (128)
    if len(raw_vector) < TARGET_VECTOR_DIM:
        # Pad with additional MFCC deltas and delta-deltas
        mfcc_delta = librosa.feature.delta(mfcc)
        mfcc_delta_mean = np.mean(mfcc_delta, axis=1)  # 13-dim
        mfcc_delta2 = librosa.feature.delta(mfcc, order=2)
        mfcc_delta2_mean = np.mean(mfcc_delta2, axis=1)  # 13-dim
        
        chroma_cens = librosa.feature.chroma_cens(y=y, sr=sr)
        chroma_cens_mean = np.mean(chroma_cens, axis=1)  # 12-dim

        extended = np.concatenate([raw_vector, mfcc_delta_mean, mfcc_delta2_mean, chroma_cens_mean])
        
        # Final pad if still short
        if len(extended) < TARGET_VECTOR_DIM:
            extended = np.pad(extended, (0, TARGET_VECTOR_DIM - len(extended)))
        feature_vector = extended[:TARGET_VECTOR_DIM]
    else:
        feature_vector = raw_vector[:TARGET_VECTOR_DIM]

    # Estimate key from chroma
    key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    key_idx = int(np.argmax(chroma_mean))
    estimated_key = key_names[key_idx]

    logger.info(
        f"Features extracted: tempo={tempo_val:.1f} BPM, key={estimated_key}, "
        f"vector_dim={len(feature_vector)}"
    )

    return {
        "feature_vector": feature_vector.tolist(),
        "tempo": tempo_val,
        "key": estimated_key,
    }
