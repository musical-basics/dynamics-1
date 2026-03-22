# 🔄 Phase 7: The "YouTube Engine" (Discovery & Community)

> **Steps 69–78** · Estimated effort: 3–4 days
> Cross-reference: [main_idea.md](file:///Users/test2/Documents/dynamics-art/docs/main_idea.md) §YouTube Addendum (Engagement, Retention & Algorithmic Discovery)

---

## Objective

Build the algorithmic recommendation engine ("Up Next" queue), interactive chapter navigation, timestamped commenting system, and the main Discovery Feed — creating the addictive engagement loop for the platform.

---

## Steps

### Step 69 — Vector Similarity RPC
- Create a Postgres RPC function in Supabase for cosine similarity search:
  ```sql
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
  ```
  > ⚠️ Provide this SQL to user for manual execution in Supabase SQL Editor.

### Step 70 — Recommendation Engine
- Create API route `GET /api/recommendations/[releaseId]`
- Hybrid approach:
  1. **Content-based:** Call `match_audio_features` RPC with current track's vector
  2. **Collaborative:** Query releases liked/played by users who also liked current track
- Merge and deduplicate results, weighted toward content-based for cold-start

### Step 71 — Autoplay Queue
- Populate `queue` in Zustand `usePlayerStore` with recommendation results
- Build `src/components/player/UpNextSidebar.tsx`:
  - Vertical list of upcoming tracks with artwork thumbnails
  - Countdown timer: "Playing next in 5... 4... 3..."
  - Draggable reordering
  - Toggle autoplay on/off

### Step 72 — Granular Navigation (Chapters)
- Create `src/components/player/ChapterMarkers.tsx`
- Fetch chapters from DB for current release
- Render clickable markers on the seek bar at their `timestamp_ms` positions
- Hover tooltip shows chapter title
- Click scrubs to chapter start

### Step 73 — Metadata UI
- Create `src/components/release/MetadataPanel.tsx`
- Display high-arts metadata fields:
  - Composer, Conductor, Soloists, Ensemble
  - Movement titles (from chapters)
  - Year, genre, instrumentation
- Elegant serif typography matching the platform aesthetic

### Step 74 — Comments UI
- Create API routes: `GET/POST /api/comments/[releaseId]`
- Build `src/components/release/CommentsPanel.tsx`
- Side-panel alongside the canvas
- Each comment displays: avatar, username, timestamp badge, body text
- Threaded replies via `parent_id`

### Step 75 — Timestamp Capture
- When user clicks "Add Comment," auto-capture `AudioContext.currentTime`
- Convert to `timestamp_ms` and attach to the comment
- Display as a clickable timecode badge: `[14:32]`

### Step 76 — Timecode Parsing
- Parse comment body text for manual timecodes using regex:
  ```ts
  const timecodeRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;
  ```
- Render matched timecodes as clickable `<button>` elements inline

### Step 77 — Click-to-Scrub
- On timecode click: parse minutes/seconds → total seconds
- Command the AudioContext to seek to that time
- Sync all canvas views (video, sheet music, MIDI, lyrics) via Master Clock

### Step 78 — Algorithmic Home Feed
- Build `src/app/(feed)/page.tsx` — the main Discovery Feed
- Dark mode masonry grid layout
- Cards show: thumbnail, title, creator, play count, duration
- Sorting: Trending, New, For You (personalized via recommendations)
- Infinite scroll with cursor-based pagination

---

## Verification Checklist

- [ ] `match_audio_features` RPC returns relevant similar tracks
- [ ] "Up Next" sidebar populates with recommendations after track loads
- [ ] Autoplay countdown works and advances to next track
- [ ] Chapter markers appear on seek bar and scrub correctly
- [ ] Comments save with correct `timestamp_ms`
- [ ] Timecodes in comment text are clickable and scrub to correct position
- [ ] Discovery Feed loads with masonry grid and infinite scroll

---

## Files Created / Modified

| Action | Path |
|---|---|
| NEW | `src/app/api/recommendations/[releaseId]/route.ts` |
| NEW | `src/app/api/comments/[releaseId]/route.ts` |
| NEW | `src/components/player/UpNextSidebar.tsx` |
| NEW | `src/components/player/ChapterMarkers.tsx` |
| NEW | `src/components/release/MetadataPanel.tsx` |
| NEW | `src/components/release/CommentsPanel.tsx` |
| NEW | `src/lib/utils/timecode.ts` |
| NEW | `src/app/(feed)/page.tsx` |
| MOD | `src/stores/usePlayerStore.ts` |
