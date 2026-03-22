# 🚀 Phase 10: Performance Audits, Security & Deployment

> **Steps 95–100** · Estimated effort: 2–3 days
> Cross-reference: [main_idea.md](file:///Users/test2/Documents/dynamics-art/docs/main_idea.md) §Infrastructure Addendum (Scalability Bottlenecks)

---

## Objective

Finalize the platform for production launch — database indexing, rAF performance tuning, sync drift testing, acoustic integrity audit, Python worker containerization, and deployment.

---

## Steps

### Step 95 — Database Indexing Audit
- Analyze Supabase query logs for slow queries
- Add strategic indexes:
  ```sql
  CREATE INDEX idx_audio_features_vector ON audio_features
    USING ivfflat (feature_vector vector_cosine_ops) WITH (lists = 100);
  CREATE INDEX idx_comments_release_ts ON comments(release_id, timestamp_ms);
  CREATE INDEX idx_chapters_release_sort ON chapters(release_id, sort_order);
  CREATE INDEX idx_releases_creator ON releases(creator_id, created_at DESC);
  CREATE INDEX idx_releases_visibility ON releases(visibility) WHERE visibility = 'public';
  ```
  > ⚠️ Provide SQL to user for manual execution in Supabase SQL Editor.

### Step 96 — Frame Drop Optimization
- Profile `requestAnimationFrame` loops with Chrome DevTools Performance tab
- MIDI Canvas: throttle rendering to 30fps for dense orchestral files (>10,000 simultaneous notes)
- Sheet Music: use `IntersectionObserver` to only render visible measures
- Add FPS counter in dev mode to monitor performance

### Step 97 — Sync Load Testing
- Create a mock 45-minute audio buffer
- Automated test: play for full duration, sample `AudioContext.currentTime` vs expected at 1-second intervals
- Assert: maximum drift < 10ms over 45 minutes
- Test all canvas modes (video, lyrics) for sync accuracy

### Step 98 — Final Acoustic Audit
- End-to-end review of the complete audio graph
- Verify: NO `DynamicsCompressorNode`, NO `WaveShaperNode` (distortion), NO brickwall limiting
- Test with reference tracks of known LUFS values
- Log and compare: `lufs_raw`, `gain_offset_db`, actual playback level
- Sign-off checklist for acoustic integrity

### Step 99 — Worker Containerization
- Create `worker/Dockerfile`:
  ```dockerfile
  FROM python:3.11-slim
  RUN apt-get update && apt-get install -y ffmpeg
  WORKDIR /app
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY . .
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- Test locally: `docker build -t dynamics-worker . && docker run -p 8000:8000 dynamics-worker`
- Deploy to Modal or RunPod (serverless GPU/CPU compute)

### Step 100 — Production Deployment
- **Frontend:** Deploy Next.js to Vercel or Cloudflare Pages
  - Set all environment variables
  - Configure custom domain: `dynamics.art`
- **Worker:** Deploy containerized Python worker
- **Final E2E tests:**
  - [ ] Upload → Process → Publish flow
  - [ ] Free tier playback (Opus + ads)
  - [ ] Premium tier playback (FLAC, no ads)
  - [ ] Media replacement with cache purge
  - [ ] Recommendation engine returns results
  - [ ] All canvas modes render and sync
- **Launch** 🚀

---

## Verification Checklist

- [ ] No slow queries in Supabase logs (all < 100ms)
- [ ] MIDI canvas maintains 30fps+ with dense orchestral files
- [ ] 45-minute sync test passes with < 10ms drift
- [ ] No limiter found in acoustic audit
- [ ] Docker container builds and runs cleanly
- [ ] Production deployment accessible at custom domain
- [ ] All E2E tests pass

---

## Files Created / Modified

| Action | Path |
|---|---|
| NEW | `worker/Dockerfile` |
| NEW | `worker/.dockerignore` |
| MOD | Database indexes (Supabase SQL Editor) |
| MOD | `src/lib/audio/syncLoop.ts` (perf tuning) |
| MOD | `src/components/canvas/MidiCanvas.tsx` (throttle) |
