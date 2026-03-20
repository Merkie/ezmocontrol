import type { Dimensions, FalQueueStatus } from "../types";

const headers = (apiKey: string) => ({
  "x-fal-key": apiKey,
});

export async function uploadFile(
  file: File,
  apiKey: string
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: headers(apiKey),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function extractFrame(
  videoUrl: string,
  apiKey: string
): Promise<{ frameUrl: string }> {
  const res = await fetch("/api/extract-frame", {
    method: "POST",
    headers: { ...headers(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Frame extraction failed" }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function generateImage(
  params: {
    frameUrl: string;
    characterImageUrl: string;
    model: string;
    frameDimensions: Dimensions;
    characterDimensions: Dimensions;
  },
  apiKey: string
): Promise<{ requestId: string; endpoint: string }> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { ...headers(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Image generation failed" }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function generateVideo(
  params: { imageUrl: string; videoUrl: string; prompt?: string },
  apiKey: string
): Promise<{ requestId: string; endpoint: string }> {
  const res = await fetch("/api/generate-video", {
    method: "POST",
    headers: { ...headers(apiKey), "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Video generation failed" }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function getJobStatus(
  endpoint: string,
  requestId: string,
  apiKey: string
): Promise<FalQueueStatus> {
  const params = new URLSearchParams({ endpoint, requestId });
  const res = await fetch(`/api/job/status?${params}`, {
    headers: headers(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Status check failed" }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function getJobResult(
  endpoint: string,
  requestId: string,
  apiKey: string
): Promise<any> {
  const params = new URLSearchParams({ endpoint, requestId });
  const res = await fetch(`/api/job/result?${params}`, {
    headers: headers(apiKey),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Result retrieval failed" }));
    throw new Error(err.error);
  }

  return res.json();
}
