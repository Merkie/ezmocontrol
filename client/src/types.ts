export type JobStatus =
  | "uploading"
  | "extracting_frame"
  | "generating_image"
  | "awaiting_approval"
  | "generating_video"
  | "complete"
  | "failed";

export interface Dimensions {
  width: number;
  height: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: string;
  videoUrl?: string;
  characterImageUrl?: string;
  frameUrl?: string;
  frameDimensions?: Dimensions;
  characterDimensions?: Dimensions;
  selectedModel: string;
  videoDuration?: number;
  costCents?: number;
  imageRequestId?: string;
  imageEndpoint?: string;
  generatedImageUrl?: string;
  videoRequestId?: string;
  videoEndpoint?: string;
  finalVideoUrl?: string;
  error?: string;
  prompt?: string;
}

export interface FalQueueStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  request_id: string;
  queue_position?: number;
  logs?: Array<{ message: string; timestamp: string }>;
  response_url?: string;
}

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  price: string;
}
