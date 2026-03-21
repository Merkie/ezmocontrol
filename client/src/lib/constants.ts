import type { ImageModel } from "../types";

export const IMAGE_MODELS: ImageModel[] = [
  {
    id: "fal-ai/nano-banana-2/edit",
    name: "Nano Banana 2",
    description: "Newer model, good quality",
    price: "$0.08/image",
  },
  {
    id: "fal-ai/nano-banana-pro/edit",
    name: "Nano Banana Pro",
    description: "Higher quality, more expensive",
    price: "$0.15/image",
  },
  {
    id: "fal-ai/gpt-image-1.5/edit",
    name: "GPT-Image 1.5",
    description: "Strong prompt adherence, variable pricing",
    price: "~$0.13/image",
  },
];

export const KLING_ENDPOINT = "fal-ai/kling-video/v3/pro/motion-control";

// Pricing in cents
export const IMAGE_PRICE_CENTS: Record<string, number> = {
  "fal-ai/nano-banana-2/edit": 8,
  "fal-ai/nano-banana-pro/edit": 15,
  "fal-ai/gpt-image-1.5/edit": 13,
};

export const KLING_PRICE_CENTS_PER_SEC = 16.8;

export const POLL_INTERVAL_IMAGE = 5000;
export const POLL_INTERVAL_VIDEO = 10000;
