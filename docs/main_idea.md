# 🏗️ SYSTEM ARCHITECTURE & PRODUCT OVERVIEW: Dynamics.art

## 1. Product Identity & Positioning

**Name:** Dynamics.art

**Description:** A high-fidelity, User-Generated Content (UGC) video and audio sanctuary built specifically for classical musicians, jazz ensembles, theater troupes, and cinematic electronic creators.

**The Core Problem:** Legacy platforms (Spotify, YouTube) use blunt-force LUFS normalization and brickwall limiters that penalize music with high dynamic range (high crest factor), squashing the transients and silence out of instrumental art to volume-match it with hyper-compressed pop music.

**The Solution:** A custom Digital Signal Processing (DSP) backend that preserves absolute acoustic integrity while safely normalizing playback using our proprietary "Spectral Density Discount" algorithm.

---

## 2. The Acoustic Engine: Spectral Density Discount (SDD)

This is the foundational math and the technological moat of the platform. We do **not** use limiters. We use a non-destructive volume offset calculated by a headless Python worker.

### The Math

When a file is uploaded, the worker uses `pyloudnorm` to calculate raw LUFS and `librosa` to calculate the mean spectral flatness. It applies this formula to determine the true loudness:

$$LUFS_{adjusted} = LUFS_{raw} - (\alpha \times F_{mean})$$

### The Result

- **Highly dense, complex instrumental tracks** (high spectral flatness) receive a mathematical "discount" to their LUFS score. This shields them from being artificially turned down, allowing their massive peaks to punch through untouched.
- **Hyper-compressed pop/hip-hop tracks** (low spectral flatness) receive no discount and are normalized normally.

### Playback

The calculated `gain_offset_db` is stored in the database. The Next.js frontend uses a custom Web Audio API node (`audioContext.createGain()`) to apply this exact offset non-destructively in the user's browser.

---

## 3. The "Split Pipeline" Ingestion Architecture

To handle both video and high-end audio without incurring massive hosting costs or buffering, we use a custom FFmpeg ingestion pipeline that treats audio and video as completely separate entities.

- **Video Processing:** The visual track is ripped and aggressively compressed into an adaptive bitrate HLS manifest (`.m3u8`) with standard resolutions (1080p, 720p, 480p). Video loads instantly and cheaply.
- **Audio Processing:** The audio track is ripped, analyzed by the SDD worker, and encoded into two formats:
  - **Premium Tier:** Uncompressed 24-bit FLAC.
  - **Standard Tier:** Mathematically transparent 320kbps Opus.
- **Storage:** All static assets (HLS chunks, FLAC files, Opus files) are stored in **Cloudflare R2** to capitalize on zero egress fees, making lossless streaming financially viable for a bootstrapped startup.

---

## 4. The Frontend & User Experience (Next.js)

- **Unified Player:** The Next.js UI seamlessly transitions between a standard audio player and a video player. Because audio and video are decoupled via HLS, users can background the app on mobile, instantly stopping the video download while continuing to stream the FLAC audio uninterrupted.
- **Aesthetic:** Strictly dark mode (true black background). Minimalist, high-contrast, audiophile-grade. Typography leans on elegant serif headings and crisp sans-serif body text to evoke a digital museum or concert hall.

---

## 5. Monetization: Curated Patronage (No Programmatic Ads)

We reject standard ad networks (like Google AdSense) because their hyper-compressed ads would ruin the dynamic range of our classical/jazz playlists (The "Car Insurance Problem").

- **Direct-Sold Sponsorships:** Ads are highly curated (boutique audio gear, theater tickets, high arts).
- **Volume-Matched Ad Ingestion:** Advertisers must submit their audio through our exact SDD worker pipeline. If an ad is heavily compressed, it is mathematically forced down in volume to perfectly match the quiet classical track that played before it.
- **Freemium Model:**
  - **Free Tier:** 320kbps Opus audio + visual/volume-matched audio sponsorships.
  - **Paid Tier:** 24-bit FLAC audio + zero ads.

---

## 📋 The "YouTube Engine" Addendum

### Engagement, Retention & Algorithmic Discovery

While the audio engine prioritizes acoustic purity, the UX and retention mechanics must mirror the high-engagement loop of YouTube.

- **Algorithmic "Up Next" Queue:** Implement a recommendation engine using collaborative filtering (watch history/likes) combined with content-based filtering (audio features extracted via Python/librosa, stored via `pgvector`) to create a highly addictive, musically cohesive autoplay rabbit hole.
- **Persistent Playback UI:** A global state management system (Zustand or React Context) to ensure the media player seamlessly minimizes to a Picture-in-Picture (PiP) or bottom-bar mini-player when navigating the site. The audio stream must never be interrupted by page navigation.
- **Granular Metadata & Navigation:** Support for user-generated chapters (crucial for multi-movement classical pieces or long DJ sets).
- **Timestamped Community Interaction:** A comment schema that supports precise timecodes, allowing users to discuss specific transients, solos, or dynamic shifts at the exact moment they occur in the playback timeline.

---

## 📋 The "Interactive Canvas" Addendum

### Interactive Canvas & Synced Notation Engine

The central media player in dynamics.art must be a multi-modal React component. While streaming high-fidelity audio (FLAC/Opus), the user can toggle the main visual canvas between four distinct modes: **Standard Video**, **Sheet Music**, **MIDI Visualizer**, and **Dynamic Lyrics/Libretto**.

### 1. Data Ingestion & Formats

When a creator uploads a performance, the ingestion pipeline must support multiplexed metadata alongside the audio/video files:

- **Score Data:** Support for MusicXML or `.mxl` files for rendering standard notation.
- **Performance Data:** Support for `.mid` (MIDI) files to map exact note-on/note-off velocities.
- **Lyric/Translation Data:** Support for standard `.vtt` (WebVTT) or `.srt` files for synced text.

### 2. The Sync Engine (The Clock)

Because we are decoupling video, audio, and interactive data, the `AudioContext.currentTime` of the high-fidelity FLAC stream acts as the **single source of truth** (the Master Clock).

All visual updates (the scrolling sheet music cursor, the falling MIDI notes, the changing lyrics) must be driven by a highly optimized `requestAnimationFrame` loop synced strictly to the audio clock to ensure zero drift over a 45-minute symphony.

### 3. Frontend Rendering Technologies

- **Sheet Music Mode:** Utilize an open-source rendering engine like OpenSheetMusicDisplay (OSMD) or VexFlow within a Next.js component to render crisp, scalable vector SVG sheet music that turns pages automatically. (just put in a placeholder for this for now, we have code that handles this)
- **MIDI Visualizer Mode (Falling Notes):** Utilize the HTML5 `<canvas>` API or WebGL to render the "ultimatepianist" falling notes and bottom keyboard. This must be heavily optimized to prevent frame drops when rendering dense orchestral MIDI files. (just put in a placeholder for this for now, we have code that handles this)
- **Opera/Lyrics Mode:** A sleek, typography-focused UI using React state to smoothly transition text. Must support multi-language toggles (e.g., viewing the original Italian and the English translation simultaneously). 

### 4. Creator Upload UX

The Next.js upload dashboard must allow creators to easily map their auxiliary files. They should be able to upload a 24-bit WAV, a 1080p MP4, and a MIDI file, and the platform multiplexes them into a single dynamics.art unified experience.

---

## 📋 The "Versioning" Addendum

### Non-Destructive Media Replacement (Version Control)

The platform must support post-publication media replacement (replacing the video track, audio master, or auxiliary interactive files) without losing the permanent URL, view count, or community engagement.

- **Database Abstraction:** Media entities (videos, `audio_tracks`) must be decoupled from the core `Post` or `Release` UUID. Replacing a file generates a new media object and updates the foreign key pointer in the core Release row.
- **DSP Recalculation:** Any replacement of the audio master must automatically re-trigger the Python ingestion worker to calculate the new Spectral Density Discount (SDD) offset.
- **Duration Validation:** To protect synced interactive elements (MIDI, MusicXML, WebVTT) and timestamped community comments, media replacements must be checked for duration drift. If the duration delta exceeds a safe threshold (e.g., > 0.5s), the creator must be warned that synced data will be unlinked or marked as visually out-of-sync.
- **Cache Invalidation:** Implementing a seamless Cloudflare API hook to purge the R2 edge cache for the specific asset upon replacement.


---

## 🛠️ The "Infrastructure & Security" Addendum

### 1. The Definitive Tech Stack

To execute the high-fidelity streaming and interactive canvas features outlined above, the stack must be strictly defined to prevent the AI from hallucinating incompatible libraries.

- **Frontend Framework:** Next.js (App Router) using React and Tailwind CSS.
- **State Management:** Zustand (Crucial for maintaining the persistent playback UI and audio stream while navigating the site).
- **Database & Auth:** Supabase (PostgreSQL). This provides native support for `pgvector` for our algorithmic "Up Next" queue, as well as robust user authentication.
- **ORM:** Drizzle ORM or Prisma for strict database typing.
- **The DSP Worker:** A headless Python environment (e.g., FastAPI deployed on a serverless compute platform like Modal or RunPod) to handle the `pyloudnorm` and `librosa` Spectral Density calculations.
- **Storage & CDN:** Cloudflare R2 for zero-egress storage of HLS chunks and FLAC files, fronted by Cloudflare CDN.

### 2. Security Vectors

Because we are hosting premium, high-arts content, we must protect the creators' IP and our own infrastructure.

- **Lossless Audio Piracy (The Ripping Problem):** Because we stream uncompressed 24-bit FLAC, music pirates will try to scrape the network tab. We must implement Signed URLs via Cloudflare. The Next.js backend generates a temporary, expiring token for the FLAC stream that is tied to the user's session, preventing hotlinking or automated `curl` downloads.
- **Upload Validation (The Trojan Problem):** When users upload their audio, video, and MIDI data, the Next.js API must aggressively validate MIME-types and file headers before sending them to the Python worker to prevent malicious code execution.
- **Worker Webhooks:** The communication between the Next.js API and the Python DSP worker must be secured via shared secret tokens to ensure malicious actors cannot trigger expensive FFmpeg encoding jobs.

### 3. Scalability Bottlenecks

We are building a highly compute-intensive platform. Anticipating bottlenecks now prevents catastrophic downtime later.

- **The Ingestion Queue:** The custom FFmpeg ingestion pipeline and Python DSP worker require massive CPU resources. If 100 creators upload a 4K video at the same time, it will crash a standard server. We must implement a message queue (like BullMQ or Redis) to stack upload jobs asynchronously. The frontend will show the user a "Processing..." state until the worker pings the database with success. *(We can build this later, not critical.)*
- **Connection Pooling:** With a highly active timestamped community interaction schema, database reads/writes will spike. We must use Supabase's built-in connection pooling (PgBouncer) to ensure Next.js serverless functions do not exhaust the database connections.