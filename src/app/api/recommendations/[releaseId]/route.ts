import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { sql } from 'drizzle-orm';

interface Props {
  params: Promise<{ releaseId: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { releaseId } = await params;

    // Hybrid recommendation:
    // 1. Content-based via pgvector cosine similarity RPC
    // 2. Fallback to recent public releases if no vector data
    
    let recommendations;
    
    try {
      // Try vector similarity search via the match_audio_features RPC
      const result = await db.execute(sql`
        SELECT 
          r.id,
          r.title,
          r.description,
          r.play_count,
          u.display_name as creator_name,
          at2.opus_url,
          at2.gain_offset_db,
          vt.hls_manifest_url,
          ma.duration_ms,
          1 - (af2.feature_vector <=> af1.feature_vector) as similarity
        FROM audio_features af1
        JOIN audio_tracks at1 ON at1.id = af1.audio_track_id
        JOIN media_assets ma1 ON ma1.id = at1.media_asset_id
        JOIN releases r1 ON r1.id = ma1.release_id AND r1.id = ${releaseId}
        CROSS JOIN audio_features af2
        JOIN audio_tracks at2 ON at2.id = af2.audio_track_id
        JOIN media_assets ma ON ma.id = at2.media_asset_id
        JOIN releases r ON r.id = ma.release_id AND r.visibility = 'public' AND r.id != ${releaseId}
        LEFT JOIN video_tracks vt ON vt.media_asset_id = ma.id
        JOIN users u ON u.id = r.creator_id
        WHERE 1 - (af2.feature_vector <=> af1.feature_vector) > 0.5
        ORDER BY af2.feature_vector <=> af1.feature_vector
        LIMIT 10
      `);
      recommendations = result.rows;
    } catch {
      // Fallback: recent public releases
      recommendations = (await db.execute(sql`
        SELECT 
          r.id,
          r.title,
          r.description,
          r.play_count,
          u.display_name as creator_name,
          at.opus_url,
          at.gain_offset_db,
          vt.hls_manifest_url,
          ma.duration_ms,
          null as similarity
        FROM releases r
        JOIN users u ON u.id = r.creator_id
        LEFT JOIN media_assets ma ON ma.id = r.current_media_asset_id
        LEFT JOIN audio_tracks at ON at.media_asset_id = ma.id
        LEFT JOIN video_tracks vt ON vt.media_asset_id = ma.id
        WHERE r.visibility = 'public' AND r.id != ${releaseId}
        ORDER BY r.created_at DESC
        LIMIT 10
      `)).rows;
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ recommendations: [] });
  }
}
