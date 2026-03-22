-- ============================================================
-- Dynamics.art — Vector Similarity RPC Function
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Step 69: Create the cosine similarity search function
CREATE OR REPLACE FUNCTION match_audio_features(
  query_vector vector(128),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  audio_track_id UUID,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    audio_track_id,
    1 - (feature_vector <=> query_vector) AS similarity
  FROM audio_features
  WHERE 1 - (feature_vector <=> query_vector) > match_threshold
  ORDER BY feature_vector <=> query_vector
  LIMIT match_count;
$$;
