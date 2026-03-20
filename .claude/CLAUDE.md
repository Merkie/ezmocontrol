# EzMoControl

## Project Overview

Open-source web tool for Kling Motion Control via the FAL API. Users upload a reference video + character image, the app swaps the character into the first frame, then generates a motion-controlled video with the new character performing the original movements.

## Architecture

**Monorepo** with npm workspaces: `client/` and `server/`.

- **Client:** React 19 + Vite + TailwindCSS v4 + TanStack React Query + Lucide React
- **Server:** Express 4 + TypeScript + `@fal-ai/client` + multer, run with `tsx`
- **Persistence:** All job state stored in browser localStorage (no database)
- **Auth:** FAL API key provided by user, stored in localStorage, sent via `x-fal-key` header per request

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
4. User reviews generated image → approve or regenerate with any model
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

- `server/src/routes/jobs.ts` — all FAL API orchestration (extract frame, submit image/video, poll status, get result)
- `server/src/routes/upload.ts` — file upload to FAL storage
- `server/src/lib/prompt.ts` — character swap prompt template with dynamic dimensions
- `client/src/components/ActiveJob.tsx` — job lifecycle UI + polling logic
- `client/src/components/Upload.tsx` — file upload + validation + job creation
- `client/src/hooks/useJobs.ts` — job state management with localStorage persistence
- `client/src/lib/api.ts` — frontend API client

## Important Notes

- FAL API key is user-provided (open source project), never hardcoded server-side
- Jobs survive page close — localStorage persists job IDs, polling resumes on return
- FAL stores output files ~30 days
- Video generation can take 5-15 minutes
- The `.env` file contains a dev FAL key — it's in `.gitignore`
- API docs for each FAL model are in the root as `.md` files
