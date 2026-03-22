# 🤖 SYSTEM PROMPT: 100-Step Execution Plan for Dynamics.art

> **AI INSTRUCTION:** You are the Lead Architect and Full-Stack Engineer for Dynamics.art. You will build this application step-by-step, strictly following the 100 steps below. Before writing any code, cross-reference the `main_idea.md` system architecture document in your context. You must adhere strictly to the defined tech stack: **Next.js App Router, Tailwind CSS, Zustand, Supabase (PostgreSQL + pgvector), Drizzle/Prisma ORM, headless Python (FastAPI), Cloudflare R2, and the Web Audio API.** Do not substitute core technologies.

---

## 🏗️ Phase 1: Core Infrastructure & Initialization (1–10)

1. **Initialize Frontend:** Create a Next.js (App Router) project with React, TypeScript, and ESLint.
2. **Configure Aesthetics:** Set up Tailwind CSS for the strictly dark mode aesthetic (true black `#000000` background, elegant serif headings, crisp sans-serif body text).
3. **State Management:** Install and initialize global state management using `zustand` to create a `usePlayerStore` (crucial for persistent audio).
4. **Database Setup:** Initialize a Supabase PostgreSQL project and capture environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
5. **ORM Setup:** Install Drizzle ORM (or Prisma) and establish the strictly typed database connection instance.
6. **Connection Pooling:** Configure Supabase PgBouncer (connection pooling) to prepare for high-volume timestamped database reads/writes without exhausting serverless connections.
7. **Storage Setup:** Configure a Cloudflare R2 storage bucket for zero-egress media storage. Set up AWS SDK/S3-compatible API credentials in `.env.local`.
8. **CDN Setup:** Set up Cloudflare CDN to front the R2 bucket, configuring custom domain routing and strict CORS policies.
9. **Worker Initialization:** Initialize a separate directory for the headless Python DSP worker using FastAPI.
10. **Worker Dependencies:** Create a `requirements.txt` for the Python worker: `pyloudnorm`, `librosa`, `ffmpeg-python`, `numpy`, `boto3`, and `fastapi`.

---

## 🗄️ Phase 2: Database Schema & Vector Search (11–20)

11. **Users Schema:** Define the `users` table schema (`id`, `email`, `subscription_tier: free | premium`).
12. **Releases Schema:** Define the core `releases` table schema (`id`, `uuid`, `creator_id`, `title`, `description`, `visibility`).
13. **Media Abstraction:** Define the `media_assets` table to explicitly decouple physical files from the `releases` table to support "Non-Destructive Media Replacement".
14. **Audio Tracks Schema:** Define the `audio_tracks` table containing DSP columns: `lufs_raw`, `spectral_flatness`, `gain_offset_db`, and URLs (FLAC, Opus).
15. **Video Tracks Schema:** Define the `video_tracks` table (`hls_manifest_url`, `resolution_tiers`) for the split visual pipeline.
16. **Auxiliary Files Schema:** Define the `aux_files` table for the Interactive Canvas (URLs for `.mid`, `.mxl`, `.vtt`).
17. **pgvector Setup:** Enable the `pgvector` extension natively in Supabase via a database migration.
18. **Embeddings Schema:** Define the `audio_features` table to store `librosa` extracted vector arrays (for the "Up Next" algorithm).
19. **Engagement Schema:** Define the `chapters` table and `comments` table, strictly including a numeric `timestamp_ms` field for playback-synced interaction.
20. **Migrate DB:** Generate and execute the initial ORM database migration to instantiate the complete PostgreSQL structure.

---

## 🔒 Phase 3: Auth, Security & Creator Upload UX (21–30)

21. **Authentication:** Implement Supabase Authentication and Next.js middleware to explicitly protect creator dashboards and premium routes.
22. **Multiplex Upload UI:** Build the Next.js Creator Upload Dashboard allowing simultaneous file selection (24-bit WAV, MP4, MIDI, MusicXML, WebVTT).
23. **The Trojan Problem:** Implement aggressive server-side MIME-type and magic-number file header validation to prevent malicious code execution.
24. **Pre-signed Uploads:** Create a Next.js API route to generate temporary, expiring Pre-signed PUT URLs for direct-to-R2 client-side uploads.
25. **Upload State:** Implement an upload progress UI indicating "Uploading..." followed by an asynchronous "Processing..." state.
26. **Webhook Security (Next.js):** Establish secure Webhook endpoints in Next.js, protected by a shared secret token, to listen for Python Worker completions.
27. **Webhook Security (Python):** Establish secure POST endpoints in the FastAPI Python worker, protected by the same shared secret, to receive DSP jobs.
28. **The Ripping Problem:** Address lossless piracy by creating a Next.js server action to generate short-lived Cloudflare Signed URLs for 24-bit FLAC streams based on active session tokens.
29. **Ingestion Queue:** Scaffold a message queue interface (e.g., BullMQ or Redis) to stack async upload jobs, preventing the Python worker from crashing if 100 creators upload simultaneously.
30. **Trigger Pipeline:** Write Next.js logic that links all multiplexed files to a single draft Release ID and POSTs the R2 object keys to the Python worker.

---

## ⚙️ Phase 4: Python DSP Worker & "Split Pipeline" Ingestion (31–45)

31. **Fetch Raw Uploads:** In the Python worker, write Boto3 logic to download the raw uploaded media from Cloudflare R2 into secure temp storage.
32. **Split Pipeline:** Build an `ffmpeg-python` wrapper to aggressively decouple/strip the visual track from the audio track.
33. **Acoustic Engine Math (pyloudnorm):** Implement `pyloudnorm` to calculate the exact integrated $LUFS_{raw}$ of the uncompressed audio.
34. **Acoustic Engine Math (librosa):** Implement `librosa` to calculate the mean spectral flatness ($F_{mean}$) of the track.
35. **SDD Algorithm:** Implement the proprietary Spectral Density Discount (SDD) formula: $LUFS_{adjusted} = LUFS_{raw} - (\alpha \times F_{mean})$.
36. **Calculate Offset:** Determine the final non-destructive `gain_offset_db` required to normalize the track safely without limiters.
37. **Premium Tier Encoding:** Use `ffmpeg-python` to encode the raw audio into uncompressed 24-bit FLAC.
38. **Standard Tier Encoding:** Use `ffmpeg-python` to encode the raw audio into mathematically transparent 320kbps Opus.
39. **Video Processing:** Build the video FFmpeg pipeline to compress the visual track into an adaptive bitrate HLS manifest (`.m3u8` with 1080p, 720p, 480p chunks).
40. **Feature Extraction:** Use `librosa` to extract multidimensional audio features (tempo, chroma) for algorithmic discovery.
41. **Cloudflare Push:** Upload the generated FLAC, Opus, HLS manifests, `.ts` chunks, and auxiliary files back to Cloudflare R2.
42. **Callback Webhook:** Trigger the secure Next.js webhook with the processing success state, file URLs, `gain_offset_db`, and extracted vector array.
43. **Database Update:** Next.js API receives the webhook and updates the `media_assets`, `audio_tracks`, and `video_tracks` database tables.
44. **Vector Storage:** Next.js API inserts the vector array into the `audio_features` pgvector table.
45. **Cleanup:** Python worker aggressively purges its local OS temp directory to prevent disk bloat. Next.js updates the frontend UI to "Published".

---

## 🎵 Phase 5: Global Player & Web Audio API (The Master Clock) (46–55)

46. **Zustand Player Store:** Update `usePlayerStore` to track `activeRelease`, `isPlaying`, `currentTime`, `duration`, and `canvasMode`.
47. **Persistent Shell:** Build a persistent bottom-bar Mini-Player component that stays active across all Next.js route changes (PiP mode).
48. **AudioContext Singleton:** Implement a dedicated Web Audio API service hook. Instantiate `AudioContext` as a global singleton.
49. **The Master Clock:** Establish `AudioContext.currentTime` as the absolute single source of truth for all audio, video, and interactive sync.
50. **Fetch SDD Offset:** Retrieve the `gain_offset_db` from the database for the currently playing track.
51. **Non-Destructive Gain:** Implement `audioContext.createGain()` to apply the SDD volume offset mathematically and non-destructively (strictly NO limiters).
52. **Tiered Audio Routing:** Write streaming logic to route Free users to the R2 Opus URL, and Premium users (via Signed URL) to the FLAC URL.
53. **Audio Graph Connection:** Connect the decoded audio stream through the `GainNode` directly to the `AudioContext.destination`.
54. **Audiophile Transport Controls:** Build custom, high-precision Play, Pause, and volume scrubber UI components referencing the Zustand store.
55. **Acoustic Verification Audit:** Add strict development logging to audit and verify that no `DynamicsCompressorNode` exists anywhere in the Web Audio API chain.

---

## 🎨 Phase 6: Video HLS & The Interactive Canvas (56–68)

56. **Multi-Modal UI:** Build the central Multi-Modal React Component for the Release page with 4 view toggles (Video, Sheet Music, MIDI, Lyrics).
57. **HLS Integration:** Integrate `hls.js` into a strictly muted `<video>` element pointing to the Cloudflare R2 `.m3u8` manifest.
58. **Master Clock Syncing:** Write a synchronization function that forces the HLS `<video>` element's playback position to trail and strictly match the AudioContext Master Clock.
59. **Background Optimization:** Implement mobile backgrounding optimization: Pause the HLS video fetch when `canvasMode` switches from Video or the app is backgrounded, keeping FLAC audio streaming uninterrupted.
60. **rAF Loop:** Set up a highly optimized `requestAnimationFrame` (rAF) loop in the PlayerEngine, strictly synced to the audio Master Clock.
61. **Sheet Music Mode Setup:** Implement Canvas Mode 2 by mounting an OpenSheetMusicDisplay (OSMD) or VexFlow React placeholder wrapper.
62. **Sheet Music Sync:** Feed the uploaded `.mxl` file to the renderer and wire it to the rAF loop to auto-turn pages based on the Master Clock.
63. **MIDI Visualizer Setup:** Implement Canvas Mode 3 by creating an HTML5 `<canvas>` / WebGL component for falling "ultimatepianist" notes.
64. **MIDI Sync:** Parse the uploaded `.mid` file and map exact note-on/note-off velocities to visual rendering, driven entirely by the rAF loop.
65. **Opera/Lyrics Mode Setup:** Implement Canvas Mode 4 by building a sleek, typography-focused UI using React state to transition text.
66. **WebVTT Parsing:** Write a utility to parse uploaded WebVTT (`.vtt`) files into an array of start/end timestamps.
67. **Libretto Sync:** Connect the parsed VTT state to the rAF loop to smoothly highlight current lyrics instantly without React re-render lag.
68. **Multi-Language Toggle:** Build the UI toggle in Lyrics mode to view source text and a translation simultaneously.

---

## 🔄 Phase 7: The "YouTube Engine" (Discovery & Community) (69–78)

69. **Vector Similarity RPC:** Create a Postgres RPC (Remote Procedure Call) to calculate vector cosine similarity distances utilizing pgvector.
70. **Recommendation Engine:** Build the "Up Next" API combining collaborative filtering (watch history/likes) and the cosine similarity RPC (content-based).
71. **Autoplay Queue:** Populate the Zustand player queue automatically, building a visual "Up Next" sidebar with an addictive countdown timer.
72. **Granular Navigation:** Render interactive Chapter UI markers reading from the `chapters` database dynamically over the main audio scrub bar.
73. **Metadata UI:** Build the UI to display granular high-arts metadata (Composer, Conductor, Soloist, Ensemble movements).
74. **Comments UI:** Build the Timestamped Commenting API (Create, Read) and the side-panel UI alongside the Multi-Modal Canvas.
75. **Timestamp Capture:** Write logic to auto-capture the exact `AudioContext.currentTime` when a user initiates a comment.
76. **Timecode Parsing:** Write regex to parse user comments for manual timecodes (e.g., "14:32") and render them as clickable links.
77. **Click-to-Scrub:** Implement an event listener on timecode links to instantly command the AudioContext and Canvas to scrub to that exact transient.
78. **Algorithmic Home Feed:** Design the main platform Discovery Feed utilizing dark mode masonry grids and algorithmic sorting.

---

## ♻️ Phase 8: Versioning & Non-Destructive Media Replacement (79–88)

79. **Replacement UI:** Build the Media Replacement UI flow in the creator dashboard ("Replace Audio Master", "Replace Video Track").
80. **Database Pointer Shift:** Write Next.js API logic to mint a new `media_assets` row and update the foreign key in `releases`, preserving the permanent UUID, URL, and view count.
81. **Trigger SDD Recalculation:** Ensure replacing an audio master automatically re-triggers the Python DSP worker to calculate a new SDD `gain_offset_db`.
82. **Duration Validation:** Write the pre-flight check calculating the delta between the old media duration and new media duration.
83. **Drift Warning UI:** If the duration delta exceeds 0.5s, trigger the Drift Warning UI, alerting the creator that synced interactive data will be impacted.
84. **Data Unlinking:** Write the database transaction to automatically flag or unlink `.vtt`, `.mxl`, and `.mid` files if the creator proceeds past the drift warning.
85. **Comment Fallback:** Update all timestamped comments to a generic un-synced state if severe duration drift occurs upon master replacement.
86. **Cache Invalidation Integration:** Implement a Next.js server action to hit the Cloudflare API and seamlessly purge the R2 edge cache specifically for the replaced asset URLs.
87. **Persistence Testing:** Test the complete loop to ensure play counts and embedded pgvector recommendations survive an audio-master replacement without breaking.
88. **Storage Optimization:** Implement Soft-Delete logic for old `media_assets` to prevent orphaned files from inflating Cloudflare R2 storage costs.

---

## 💰 Phase 9: Monetization & Ad Ingestion (89–94)

89. **Sponsor Upload Flow:** Build an isolated upload ingestion pipeline specifically for Direct-Sold Boutique Advertisers.
90. **Enforced Volume Matching:** Hard-route all advertisement audio through the exact SDD worker math pipeline. Hyper-compressed ads receive no discount ($0 \times F_{mean}$).
91. **Ad Injection Engine:** Write the Free Tier logic to fetch and preload a sponsorship audio file, queuing it seamlessly in the AudioContext.
92. **Ad Normalization:** Ensure the Ad `GainNode` applies the calculated `gain_offset_db`, mathematically forcing the ad down in volume to perfectly match the quiet classical track playing before it (Solving "The Car Insurance Problem").
93. **Stripe Integration:** Implement Stripe checkout integration for the Freemium upgrade path.
94. **Premium Unlock:** Update the Supabase `users` row upon successful Stripe checkout to immediately unlock 24-bit FLAC routing and bypass the ad-injection queue entirely.

---

## 🚀 Phase 10: Performance Audits, Security & Deployment (95–100)

95. **Database Indexing Audit:** Analyze Supabase query logs and add strategic indexes to the `comments`, `audio_features`, and `chapters` tables to prevent PgBouncer bottlenecks.
96. **Frame Drop Optimization:** Conduct a performance audit on the `requestAnimationFrame` loops. Add throttling to prevent CPU thermal throttling and frame drops on dense orchestral MIDI files.
97. **Sync Load Testing:** Create a mock 45-minute audio file and run an automated load test ensuring the synced canvas features exhibit exactly zero drift over time.
98. **Final Acoustic Audit:** Conduct an end-to-end review of the frontend player and DSP backend logs to guarantee absolutely zero brickwall limiting exists in production.
99. **Worker Containerization:** Create a Dockerfile for the Python worker to ensure deterministic DSP outputs, and deploy to a serverless compute platform (Modal or RunPod).
100. **Production Deployment:** Deploy the Next.js frontend to Vercel or Cloudflare Pages, run final E2E integration tests, and launch Dynamics.art.