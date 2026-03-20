import { Router } from "express";
import { getFalClient } from "../lib/fal";
import { buildCharacterSwapPrompt } from "../lib/prompt";

export const jobsRouter = Router();

// Extract first frame from video
jobsRouter.post("/extract-frame", async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const { videoUrl } = req.body;
    const fal = getFalClient(apiKey);

    const result = await fal.subscribe("fal-ai/ffmpeg-api/extract-frame", {
      input: { video_url: videoUrl, frame_type: "first" },
    });

    const images = (result.data as any).images;
    res.json({ frameUrl: images[0].url });
  } catch (error: any) {
    console.error("Extract frame error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Frame extraction failed",
    });
  }
});

// Submit image generation job
jobsRouter.post("/generate-image", async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const {
      frameUrl,
      characterImageUrl,
      model,
      frameDimensions,
      characterDimensions,
    } = req.body;

    const fal = getFalClient(apiKey);
    const prompt = buildCharacterSwapPrompt(frameDimensions, characterDimensions);

    // Build model-specific input
    const isGptImage = model === "fal-ai/gpt-image-1.5/edit";
    const input: Record<string, any> = {
      prompt,
      image_urls: [frameUrl, characterImageUrl],
      num_images: 1,
      output_format: "png",
    };

    if (isGptImage) {
      input.image_size = "auto";
      input.quality = "high";
      input.input_fidelity = "high";
    } else {
      input.resolution = "1K";
      input.aspect_ratio = "auto";
    }

    const result = await fal.queue.submit(model, { input });

    res.json({
      requestId: result.request_id,
      endpoint: model,
    });
  } catch (error: any) {
    console.error("Generate image error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Image generation submission failed",
    });
  }
});

// Submit video generation job
jobsRouter.post("/generate-video", async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const { imageUrl, videoUrl, prompt } = req.body;
    const fal = getFalClient(apiKey);

    const endpoint = "fal-ai/kling-video/v3/pro/motion-control";
    const result = await fal.queue.submit(endpoint, {
      input: {
        prompt: prompt || "A character performing the action shown in the reference video",
        image_url: imageUrl,
        video_url: videoUrl,
        keep_original_sound: true,
        character_orientation: "image",
        elements: null,
      },
    });

    res.json({
      requestId: result.request_id,
      endpoint,
    });
  } catch (error: any) {
    console.error("Generate video error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Video generation submission failed",
    });
  }
});

// Check job status
jobsRouter.get("/job/status", async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const { endpoint, requestId } = req.query as {
      endpoint: string;
      requestId: string;
    };

    const fal = getFalClient(apiKey);
    const status = await fal.queue.status(endpoint, {
      requestId,
      logs: true,
    });

    res.json(status);
  } catch (error: any) {
    console.error("Job status error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Status check failed",
    });
  }
});

// Get job result
jobsRouter.get("/job/result", async (req, res) => {
  try {
    const apiKey = req.headers["x-fal-key"] as string;
    if (!apiKey) {
      res.status(401).json({ error: "Missing FAL API key" });
      return;
    }

    const { endpoint, requestId } = req.query as {
      endpoint: string;
      requestId: string;
    };

    const fal = getFalClient(apiKey);
    const result = await fal.queue.result(endpoint, { requestId });

    // fal.queue.result() may return { data: ... } or raw output — normalize
    const output = (result as any)?.data ?? result;
    res.json(output);
  } catch (error: any) {
    console.error("Job result error:", error);
    res.status(error.status || 500).json({
      error: error.message || "Result retrieval failed",
    });
  }
});
