# Dynamics.art — Railway Setup Guide

## Architecture

You need **2 services** in Railway:

| Service | What it runs | Root Directory |
|---------|-------------|----------------|
| **dynamics-web** | Next.js app | `/` (repo root) |
| **dynamics-worker** | Python DSP worker | `/worker` |

---

## Step 1: Fix the existing service (Next.js web app)

Your existing `dynamics-1` service crashed because it needs env vars. In Railway dashboard:

1. Click on the `dynamics-1` service (or `ultimate-pianist-v1`)
2. Go to **Settings → Build**  
3. Make sure **Root Directory** is empty (or `/`) — this is the Next.js app
4. Go to **Variables** tab and add ALL of these:

```
NEXT_PUBLIC_SUPABASE_URL=<your supabase url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your supabase anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
DATABASE_URL=<your supabase pgbouncer connection string>
R2_ACCOUNT_ID=b91da5be526aaa1112b67eb4faba9315
R2_ACCESS_KEY_ID=c408426658b2b1d67b4fcf7d8fd48273
R2_SECRET_ACCESS_KEY=<your R2 secret>
R2_BUCKET_NAME=dynamics-media
R2_PUBLIC_URL=https://pub-a32a93a9d31d4ee5803c8a88acb7ded7.r2.dev
WORKER_WEBHOOK_SECRET=<generate a random secret, e.g. openssl rand -hex 32>
STRIPE_SECRET_KEY=<your stripe secret key>
STRIPE_WEBHOOK_SECRET=<your stripe webhook secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your stripe publishable key>
CF_ZONE_ID=<your cloudflare zone id>
CF_API_TOKEN=<your cloudflare api token>
WORKER_URL=<will be the worker service's Railway URL, fill in after Step 2>
```

5. Click **Deploy**

---

## Step 2: Create the Worker service

1. In your Railway project, click **+ New** → **Service** → **GitHub Repo**
2. Select the same repo: `musical-basics/dynamics-1`
3. Once created, go to **Settings**:
   - **Root Directory**: set to `worker`
   - Railway will auto-detect the `Dockerfile` in `worker/`
4. Go to **Variables** tab and add:

```
R2_ACCOUNT_ID=b91da5be526aaa1112b67eb4faba9315
R2_ACCESS_KEY_ID=c408426658b2b1d67b4fcf7d8fd48273
R2_SECRET_ACCESS_KEY=<same R2 secret as above>
R2_BUCKET_NAME=dynamics-media
WORKER_WEBHOOK_SECRET=<same secret you used in Step 1>
NEXTJS_URL=<the dynamics-web Railway URL, e.g. https://dynamics-1-production.up.railway.app>
```

5. Go to **Settings → Networking** → **Generate Domain** (to get a public URL)
6. Copy the generated URL (e.g. `https://dynamics-worker-production.up.railway.app`)
7. Go back to the **dynamics-web** service → Variables → set `WORKER_URL` to this URL

---

## Step 3: Connect them

After both services are deployed:

1. **dynamics-web** `WORKER_URL` → points to worker's Railway URL
2. **dynamics-worker** `NEXTJS_URL` → points to web app's Railway URL  
3. Both share the same `WORKER_WEBHOOK_SECRET`

This creates the bidirectional communication:
- Web → Worker: "Process this upload" (`POST /jobs/process`)
- Worker → Web: "Here are the results" (`POST /api/webhooks/worker-callback`)

---

## Quick Commands

Generate a shared webhook secret:
```bash
openssl rand -hex 32
```

Verify worker health after deploy:
```bash
curl https://<your-worker-url>.up.railway.app/health
```

Expected response:
```json
{"status": "ok", "service": "dynamics-dsp-worker"}
```
