# EzMoControl

A simple web interface for [Kling Motion Control](https://fal.ai/models/fal-ai/kling-video/v3/pro/motion-control) via the [FAL](https://fal.ai) API. Upload a reference video and a character image — the app swaps the character into the scene and generates a motion-controlled video.

## How It Works

1. **Upload** a reference video (.mp4, 10 seconds max) and a character image
2. **Select** an image model (Nano Banana 2, Nano Banana Pro, or GPT-Image 1.5)
3. The app extracts the first frame from your video, then generates a new image with your character swapped in
4. **Review** the generated image — approve it or regenerate with a different model
5. Once approved, the app generates a motion-controlled video using Kling v3 Pro
6. **Download** your final video

You can close the page during generation and come back later — all job state is saved locally.

## Setup

You'll need a [FAL API key](https://fal.ai/dashboard/keys). The app will prompt you for it on first launch.

```bash
git clone https://github.com/your-username/ezmocontrol.git
cd ezmocontrol
npm install
npm run dev
```

Open [http://localhost:3721](http://localhost:3721).

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, TanStack Query, Lucide React
- **Backend:** Express, TypeScript, @fal-ai/client
- **FAL APIs:** ffmpeg frame extraction, Nano Banana 2/Pro, GPT-Image 1.5, Kling v3 Motion Control

## Image Models

| Model | Price | Notes |
|-------|-------|-------|
| Nano Banana 2 | $0.08/image | Newer, good default |
| Nano Banana Pro | $0.15/image | Higher quality |
| GPT-Image 1.5 | ~$0.13/image | Strong prompt adherence |

Video generation via Kling v3 Pro costs $0.168 per second of output video.

## License

MIT
