# 🏗️ Phase 1: Core Infrastructure & Initialization

> **Steps 1–10** · Estimated effort: 1–2 days
> Cross-reference: [main_idea.md](file:///Users/test2/Documents/dynamics-art/docs/main_idea.md) §1 (Product Identity), §Infrastructure Addendum (Tech Stack)

---

## Objective

Stand up the complete development environment — frontend, database, storage, and Python worker — so every subsequent phase has a fully wired foundation to build on.

---

## Tech Stack Locked In

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), React, TypeScript, ESLint |
| Styling | Tailwind CSS (dark mode, true black `#000000`) |
| State | Zustand (`usePlayerStore`) |
| Database | Supabase PostgreSQL + PgBouncer |
| ORM | Drizzle ORM (or Prisma) |
| Storage | Cloudflare R2 (S3-compatible, zero-egress) |
| CDN | Cloudflare CDN fronting R2 |
| DSP Worker | Python 3.11+ / FastAPI |

---

## Steps

### Step 1 — Initialize Frontend
- Create Next.js App Router project: `npx -y create-next-app@latest ./ --app --typescript --eslint --src-dir --tailwind`
- Verify `pnpm dev` runs clean on `localhost:3000`

### Step 2 — Configure Aesthetics
- Set Tailwind config for strict dark mode (`darkMode: 'class'`)
- Define color tokens: background `#000000`, surface `#0A0A0A`, accent palette
- Import Google Fonts: serif heading (e.g., Playfair Display) + sans-serif body (e.g., Inter)
- Set global `body` to true black background

### Step 3 — State Management
- `pnpm add zustand`
- Create `src/stores/usePlayerStore.ts` with initial shape:
  ```ts
  interface PlayerState {
    activeRelease: Release | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    canvasMode: 'video' | 'sheet' | 'midi' | 'lyrics';
    gainOffsetDb: number;
  }
  ```

### Step 4 — Database Setup
- Create Supabase project at [supabase.com](https://supabase.com)
- Add to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
  > ⚠️ User must fill these out manually.

### Step 5 — ORM Setup
- `pnpm add drizzle-orm @neondatabase/serverless` (or Prisma)
- Create `src/db/index.ts` with typed client connecting via `DATABASE_URL`
- Add `DATABASE_URL` to `.env.local`

### Step 6 — Connection Pooling
- Enable PgBouncer in Supabase Dashboard → Settings → Database → Connection Pooling
- Use the pooled connection string for all serverless API routes

### Step 7 — Storage Setup
- Create Cloudflare R2 bucket (e.g., `dynamics-media`)
- Generate R2 API token with S3-compatible access
- Add to `.env.local`:
  ```
  R2_ACCOUNT_ID=
  R2_ACCESS_KEY_ID=
  R2_SECRET_ACCESS_KEY=
  R2_BUCKET_NAME=dynamics-media
  R2_PUBLIC_URL=
  ```
  > ⚠️ User must fill these out manually.

### Step 8 — CDN Setup
- Configure Cloudflare custom domain pointing to R2 bucket
- Set strict CORS headers: allow only `dynamics.art` origin
- Enable cache rules for `.m3u8`, `.ts`, `.flac`, `.opus` assets

### Step 9 — Worker Initialization
- Create `worker/` directory at project root
- Init FastAPI app in `worker/main.py`
- Create `worker/requirements.txt`
- Create `worker/.env` template

### Step 10 — Worker Dependencies
- `worker/requirements.txt`:
  ```
  fastapi>=0.110.0
  uvicorn>=0.29.0
  pyloudnorm>=0.1.1
  librosa>=0.10.1
  ffmpeg-python>=0.2.0
  numpy>=1.26.0
  boto3>=1.34.0
  python-dotenv>=1.0.0
  ```

---

## Verification Checklist

- [ ] `pnpm dev` starts Next.js on `localhost:3000` with true black background
- [ ] Zustand store initializes without errors in React DevTools
- [ ] `.env.local` contains all placeholder keys (Supabase, R2)
- [ ] Drizzle client connects to Supabase pooled URL
- [ ] `worker/main.py` runs via `uvicorn worker.main:app --reload`
- [ ] All dependencies install cleanly (`pnpm install` + `pip install -r requirements.txt`)

---

## Files Created / Modified

| Action | Path |
|---|---|
| NEW | `src/stores/usePlayerStore.ts` |
| NEW | `src/db/index.ts` |
| NEW | `worker/main.py` |
| NEW | `worker/requirements.txt` |
| NEW | `worker/.env` |
| MOD | `tailwind.config.ts` |
| MOD | `src/app/globals.css` |
| MOD | `src/app/layout.tsx` |
| MOD | `.env.local` |
