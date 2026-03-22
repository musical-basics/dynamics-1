# 💰 Phase 9: Monetization & Ad Ingestion

> **Steps 89–94** · Estimated effort: 2–3 days
> Cross-reference: [main_idea.md](file:///Users/test2/Documents/dynamics-art/docs/main_idea.md) §5 (Monetization: Curated Patronage)

---

## Objective

Implement the curated ad pipeline that forces sponsor audio through the SDD worker (solving "The Car Insurance Problem"), Stripe premium subscriptions, and the freemium tier split.

---

## The Car Insurance Problem — Solved

> A listener finishes a pianissimo Debussy piece at -23 LUFS. A hyper-compressed car insurance ad blasts at -8 LUFS. The dynamic range is destroyed.

**Our solution:** Every ad runs through the SDD pipeline. Compressed ads (low spectral flatness) receive no discount and are mathematically turned **down** to match the preceding quiet music.

---

## Steps

### Step 89 — Sponsor Upload Flow
- Build `src/app/admin/sponsors/page.tsx` — isolated sponsor management dashboard
- Sponsors upload audio creative (WAV or high-quality MP3)
- Admin review workflow: Pending → Approved → Active → Expired
- Metadata: brand name, campaign name, target genres, date range

### Step 90 — Enforced Volume Matching
- Route all sponsor audio through the **exact same** Python DSP worker pipeline
- Calculate `lufs_raw`, `spectral_flatness`, `gain_offset_db` for every ad
- Compressed ads (low `F_mean`) → minimal discount → turned **down**
- Store ad's `gain_offset_db` in `sponsor_audio_tracks` table

### Step 91 — Ad Injection Engine
- Create `src/lib/audio/adEngine.ts`
- Free tier only — queue a sponsor audio after every N tracks (configurable)
- Pre-fetch sponsor audio during previous track to prevent gaps
- Transition: `currentTrack → adAudio → nextTrack`

### Step 92 — Ad Normalization
- Dedicated `GainNode` for ad audio in the Web Audio API graph:
  ```ts
  const adGain = ctx.createGain();
  adGain.gain.value = Math.pow(10, adGainOffsetDb / 20);
  adSource.connect(adGain).connect(volumeGain).connect(ctx.destination);
  ```
- No perceptual volume jump — ever

### Step 93 — Stripe Integration
- `pnpm add @stripe/stripe-js stripe`
- API routes: `POST /api/stripe/checkout` + `POST /api/stripe/webhook`
- Add to `.env.local`:
  ```
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  ```
  > ⚠️ User must fill these out and configure Stripe webhook.

### Step 94 — Premium Unlock
- On Stripe `checkout.session.completed` webhook:
  - Update `users.subscription_tier` → `'premium'`
  - Store `stripe_customer_id`
- Effects: FLAC routing, no ads, premium badge

---

## Verification Checklist

- [ ] Sponsor audio → SDD worker → correct `gain_offset_db`
- [ ] Compressed ad is audibly quieter after quiet classical track
- [ ] Free tier: ads play every N tracks seamlessly
- [ ] Premium tier: no ads, FLAC streams
- [ ] Stripe checkout updates `subscription_tier`

---

## Files Created / Modified

| Action | Path |
|---|---|
| NEW | `src/app/admin/sponsors/page.tsx` |
| NEW | `src/lib/audio/adEngine.ts` |
| NEW | `src/app/api/stripe/checkout/route.ts` |
| NEW | `src/app/api/stripe/webhook/route.ts` |
| NEW | `src/db/schema/sponsor-audio-tracks.ts` |
| MOD | `.env.local` |
