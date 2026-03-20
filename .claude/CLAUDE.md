# EzMoControl

## Project Overview

Open-source web tool for Kling Motion Control via the FAL API. Users upload a reference video + character image, the app swaps the character into the first frame, then generates a motion-controlled video with the new character performing the original movements.

## Architecture

**Monorepo** with npm workspaces: `client/` and `server/`.

- **Client:** React 19 + Vite + TailwindCSS v4 + TanStack React Query + Lucide React
- **Server:** Express 4 + TypeScript + `@fal-ai/client` + multer, run with `tsx`
- **Persistence:** All job state stored in browser localStorage (no database)
- **Auth:** FAL API key provided by user, encrypted in localStorage via AES-GCM-256 (Web Crypto API), sent via `x-fal-key` header per request. The encryption key is non-extractable and stored in IndexedDB.

## Running

```
npm install
npm run dev
```

Server runs on port 3720, client on port 3721 (Vite proxies `/api` to server).

## Pipeline Flow

1. Upload video (.mp4, ≤10s) + character image → FAL storage via `fal.storage.upload()`
2. Extract first frame → `fal-ai/ffmpeg-api/extract-frame` (synchronous via `fal.subscribe()`)
3. Character swap image → queue submit to selected model (`fal.queue.submit()`)
4. User reviews generated image (before/after comparison slider) → approve or regenerate with any model (confirmation modal)
5. Video generation → `fal-ai/kling-video/v3/pro/motion-control` queue submit
6. Poll for results → `fal.queue.status()` / `fal.queue.result()`

## FAL API Details

- `fal.subscribe()` returns `{ data, requestId }` — access output via `result.data`
- `fal.queue.result()` also wraps output in `{ data }` — server normalizes this before sending to client
- `fal.queue.submit()` returns `{ request_id }` (snake_case)
- `fal.queue.status()` options use `requestId` (camelCase)

### Image Models (character swap step)

| Model | Endpoint | Price |
|-------|----------|-------|
| Nano Banana 2 | `fal-ai/nano-banana-2/edit` | $0.08/img |
| Nano Banana Pro | `fal-ai/nano-banana-pro/edit` | $0.15/img |
| GPT-Image 1.5 | `fal-ai/gpt-image-1.5/edit` | ~$0.13/img |

GPT-Image 1.5 uses different params (`image_size`, `quality`, `input_fidelity`) vs Nano Banana models (`resolution`, `aspect_ratio`). The server handles this in `/api/generate-image`.

### Video Model

Kling v3 Pro Motion Control: `fal-ai/kling-video/v3/pro/motion-control` — always uses `character_orientation: "image"` (max 10s video).

## Key Files

### Server
- `server/src/routes/jobs.ts` — all FAL API orchestration (extract frame, submit image/video, poll status, get result)
- `server/src/routes/upload.ts` — file upload to FAL storage
- `server/src/lib/prompt.ts` — character swap prompt template with dynamic dimensions

### Client — Components
- `client/src/App.tsx` — main layout, routing between Upload/ActiveJob, settings modal, `ApiKeyEntry` onboarding component
- `client/src/components/ActiveJob.tsx` — job lifecycle UI + polling logic + regenerate confirmation + image lightbox
- `client/src/components/Upload.tsx` — file upload + validation + job creation (drag-over states, video metadata caching)
- `client/src/components/JobHistory.tsx` — sidebar job list with thumbnails
- `client/src/components/Modal.tsx` — reusable modal with enter/exit transitions (double rAF technique) + `ConfirmModal` export
- `client/src/components/SettingsModal.tsx` — settings modal (API key management with show/hide toggle)
- `client/src/components/BeforeAfterSlider.tsx` — drag-to-compare image slider (imperative DOM updates for performance)
- `client/src/components/ImageLightbox.tsx` — full-screen image viewer with scale/fade transitions, download button

### Client — Logic
- `client/src/hooks/useJobs.ts` — job state management with localStorage persistence, memoized sorting
- `client/src/lib/api.ts` — frontend API client
- `client/src/lib/storage.ts` — encrypted API key storage (AES-GCM via Web Crypto + IndexedDB), job persistence, cached CryptoKey
- `client/src/lib/constants.ts` — image model configs, polling intervals, Kling endpoint
- `client/src/types.ts` — Job, Dimensions, FalQueueStatus types

## Important Notes

- FAL API key is user-provided (open source project), never hardcoded server-side
- API key is encrypted at rest in localStorage using AES-GCM-256; the CryptoKey is non-extractable in IndexedDB
- Jobs survive page close — localStorage persists job IDs, polling resumes on return
- FAL stores output files ~30 days
- Video generation can take 5-15 minutes
- The `.env` file contains a dev FAL key — it's in `.gitignore`
- API docs for each FAL model are in the root as `.md` files
- Modal transitions use the double `requestAnimationFrame` technique for enter, `setTimeout` for exit cleanup
- BeforeAfterSlider uses imperative DOM manipulation (refs) during drag to avoid React re-render overhead
