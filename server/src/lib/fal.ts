import { createFalClient } from "@fal-ai/client";

export function getFalClient(apiKey: string) {
  return createFalClient({ credentials: apiKey });
}
