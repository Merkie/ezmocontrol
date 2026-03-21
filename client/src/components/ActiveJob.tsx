import { useEffect, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Loader2,
  RefreshCw,
  Download,
  AlertCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { Job } from "../types";
import { IMAGE_MODELS, POLL_INTERVAL_IMAGE, POLL_INTERVAL_VIDEO, IMAGE_PRICE_CENTS, KLING_PRICE_CENTS_PER_SEC } from "../lib/constants";
import * as api from "../lib/api";
import { ConfirmModal } from "./Modal";
import BeforeAfterSlider from "./BeforeAfterSlider";
import ImageLightbox from "./ImageLightbox";
import SnakeGame from "./SnakeGame";

interface Props {
  job: Job;
  apiKey: string;
  updateJob: (id: string, updates: Partial<Job>) => void;
  onBack: () => void;
}

const STEPS = [
  { key: "uploading", label: "Upload" },
  { key: "extracting_frame", label: "Extract" },
  { key: "generating_image", label: "Image Gen" },
  { key: "awaiting_approval", label: "Review" },
  { key: "generating_video", label: "Video Gen" },
  { key: "complete", label: "Done" },
] as const;

function getStepIndex(status: string): number {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function ActiveJob({ job, apiKey, updateJob, onBack }: Props) {
  const [regenModel, setRegenModel] = useState(job.selectedModel);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Poll image generation status
  const imageStatus = useQuery({
    queryKey: ["job-status", job.imageEndpoint, job.imageRequestId],
    queryFn: () =>
      api.getJobStatus(job.imageEndpoint!, job.imageRequestId!, apiKey),
    enabled:
      job.status === "generating_image" &&
      !!job.imageRequestId &&
      !!job.imageEndpoint,
    refetchInterval: POLL_INTERVAL_IMAGE,
  });

  // Poll video generation status
  const videoStatus = useQuery({
    queryKey: ["job-status", job.videoEndpoint, job.videoRequestId],
    queryFn: () =>
      api.getJobStatus(job.videoEndpoint!, job.videoRequestId!, apiKey),
    enabled:
      job.status === "generating_video" &&
      !!job.videoRequestId &&
      !!job.videoEndpoint,
    refetchInterval: POLL_INTERVAL_VIDEO,
  });

  // Handle image generation completion
  useEffect(() => {
    if (!imageStatus.data || job.status !== "generating_image") return;

    if (imageStatus.data.status === "COMPLETED") {
      api
        .getJobResult(job.imageEndpoint!, job.imageRequestId!, apiKey)
        .then((result) => {
          const imageUrl = result.images?.[0]?.url;
          if (imageUrl) {
            updateJob(job.id, {
              status: "awaiting_approval",
              generatedImageUrl: imageUrl,
            });
          } else {
            updateJob(job.id, {
              status: "failed",
              error: "No image in result",
            });
          }
        })
        .catch((err) => {
          updateJob(job.id, { status: "failed", error: err.message });
        });
    }
  }, [imageStatus.data, job.status, job.id, job.imageEndpoint, job.imageRequestId, apiKey, updateJob]);

  // Handle video generation completion
  useEffect(() => {
    if (!videoStatus.data || job.status !== "generating_video") return;

    if (videoStatus.data.status === "COMPLETED") {
      api
        .getJobResult(job.videoEndpoint!, job.videoRequestId!, apiKey)
        .then((result) => {
          const videoUrl = result.video?.url;
          if (videoUrl) {
            updateJob(job.id, {
              status: "complete",
              finalVideoUrl: videoUrl,
            });
          } else {
            updateJob(job.id, {
              status: "failed",
              error: "No video in result",
            });
          }
        })
        .catch((err) => {
          updateJob(job.id, { status: "failed", error: err.message });
        });
    }
  }, [videoStatus.data, job.status, job.id, job.videoEndpoint, job.videoRequestId, apiKey, updateJob]);

  // Regenerate image
  const handleRegenerate = useCallback(async () => {
    const addedCost = IMAGE_PRICE_CENTS[regenModel] ?? 0;
    updateJob(job.id, {
      status: "generating_image",
      selectedModel: regenModel,
      generatedImageUrl: undefined,
      imageRequestId: undefined,
      imageEndpoint: undefined,
      error: undefined,
      costCents: (job.costCents ?? 0) + addedCost,
    });

    try {
      const result = await api.generateImage(
        {
          frameUrl: job.frameUrl!,
          characterImageUrl: job.characterImageUrl!,
          model: regenModel,
          frameDimensions: job.frameDimensions!,
          characterDimensions: job.characterDimensions!,
        },
        apiKey
      );

      updateJob(job.id, {
        imageRequestId: result.requestId,
        imageEndpoint: result.endpoint,
      });
    } catch (error: any) {
      updateJob(job.id, { status: "failed", error: error.message });
    }
  }, [job, regenModel, apiKey, updateJob]);

  // Approve image and start video generation
  const handleApprove = useCallback(async () => {
    const videoCost = Math.round((job.videoDuration ?? 5) * KLING_PRICE_CENTS_PER_SEC);
    updateJob(job.id, {
      status: "generating_video",
      error: undefined,
      costCents: (job.costCents ?? 0) + videoCost,
    });

    try {
      const result = await api.generateVideo(
        {
          imageUrl: job.generatedImageUrl!,
          videoUrl: job.videoUrl!,
          prompt: job.prompt,
        },
        apiKey
      );

      updateJob(job.id, {
        videoRequestId: result.requestId,
        videoEndpoint: result.endpoint,
      });
    } catch (error: any) {
      updateJob(job.id, { status: "failed", error: error.message });
    }
  }, [job, apiKey, updateJob]);

  const currentStep = getStepIndex(job.status);
  const currentLogs =
    job.status === "generating_image"
      ? imageStatus.data?.logs
      : job.status === "generating_video"
        ? videoStatus.data?.logs
        : undefined;
  const queuePosition =
    job.status === "generating_image"
      ? imageStatus.data?.queue_position
      : job.status === "generating_video"
        ? videoStatus.data?.queue_position
        : undefined;

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 text-dim hover:text-neon hover:bg-neon/5 rounded transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-display font-semibold uppercase tracking-wide">Job</h2>
          <p className="text-[10px] text-dim font-mono tracking-wider">{job.id.slice(0, 8)}</p>
        </div>
        <span className="text-xs text-dim font-mono tracking-wide">
          {job.costCents != null
            ? `$${(job.costCents / 100).toFixed(2)}`
            : "—"}
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 shrink-0">
              {i < currentStep || job.status === "complete" ? (
                <CheckCircle className="w-4 h-4 text-neon shrink-0" />
              ) : i === currentStep && job.status === "awaiting_approval" ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : i === currentStep && job.status !== "failed" ? (
                <Loader2 className="w-4 h-4 text-cyan animate-spin shrink-0" />
              ) : job.status === "failed" && i === currentStep ? (
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-edge shrink-0" />
              )}
              <span
                className={`text-[11px] uppercase tracking-wider whitespace-nowrap ${
                  i === currentStep && job.status === "awaiting_approval"
                    ? "text-amber-400"
                    : i <= currentStep
                      ? job.status === "failed" && i === currentStep
                        ? "text-danger"
                        : "text-haze"
                      : "text-dim/50"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${
                  i < currentStep ? "bg-neon/30" : "bg-edge"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status content */}
      <div className="space-y-6">
        {/* Loading states */}
        {(job.status === "uploading" ||
          job.status === "extracting_frame") && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
            <p className="text-dim text-sm tracking-wide">
              {job.status === "uploading"
                ? "Uploading files to FAL..."
                : "Extracting first frame..."}
            </p>
          </div>
        )}

        {/* Generating image */}
        {job.status === "generating_image" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
            <p className="text-dim text-sm tracking-wide">Generating character swap...</p>
            {queuePosition != null && queuePosition > 0 && (
              <p className="text-[11px] text-dim/70 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Queue position: {queuePosition}
              </p>
            )}
            {currentLogs && currentLogs.length > 0 && (
              <div className="w-full max-w-md mt-4 p-3 bg-void border border-edge rounded max-h-32 overflow-y-auto">
                {currentLogs.map((log, i) => (
                  <p key={i} className="text-[11px] text-dim font-mono">
                    <span className="text-neon/50 mr-1">&gt;</span>
                    {log.message}
                  </p>
                ))}
              </div>
            )}
            <SnakeGame />
          </div>
        )}

        {/* Awaiting approval - Before/After slider */}
        {job.status === "awaiting_approval" && job.generatedImageUrl && (
          <div className="space-y-6">
            <BeforeAfterSlider
              beforeSrc={job.frameUrl!}
              afterSrc={job.generatedImageUrl}
              beforeLabel="Original Frame"
              afterLabel="Generated"
            />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs text-dim uppercase tracking-wider shrink-0">
                  Model:
                </label>
                <select
                  value={regenModel}
                  onChange={(e) => setRegenModel(e.target.value)}
                  className="flex-1 px-3 py-2 bg-panel border border-edge rounded text-sm focus:outline-none focus:border-neon transition-all"
                >
                  {IMAGE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRegenConfirm(true)}
                  className="flex-1 py-3 border border-edge text-haze hover:border-magenta hover:text-magenta rounded text-sm font-medium uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 py-3 bg-neon text-void rounded text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Generate Video
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generating video */}
        {job.status === "generating_video" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-8 h-8 text-cyan animate-spin" />
            <p className="text-dim text-sm tracking-wide">Generating video...</p>
            <p className="text-[11px] text-dim/60">
              This may take 5–15 min. Feel free to close this page.
            </p>
            {queuePosition != null && queuePosition > 0 && (
              <p className="text-[11px] text-dim/70 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Queue position: {queuePosition}
              </p>
            )}
            {currentLogs && currentLogs.length > 0 && (
              <div className="w-full max-w-md mt-4 p-3 bg-void border border-edge rounded max-h-32 overflow-y-auto">
                {currentLogs.map((log, i) => (
                  <p key={i} className="text-[11px] text-dim font-mono">
                    <span className="text-neon/50 mr-1">&gt;</span>
                    {log.message}
                  </p>
                ))}
              </div>
            )}
            {job.generatedImageUrl && (
              <div className="mt-4">
                <p className="text-[11px] text-dim mb-2 text-center uppercase tracking-wider">Approved image</p>
                <img
                  src={job.generatedImageUrl}
                  alt="Approved"
                  className="max-h-48 rounded border border-edge cursor-pointer transition-all hover:border-neon/50 hover:glow-neon"
                  onClick={() => setLightboxSrc(job.generatedImageUrl!)}
                />
              </div>
            )}
            <SnakeGame />
          </div>
        )}

        {/* Complete */}
        {job.status === "complete" && job.finalVideoUrl && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-10 h-10 text-neon" style={{ filter: "drop-shadow(0 0 12px rgba(0, 255, 136, 0.5))" }} />
              <p className="text-lg font-display font-semibold uppercase tracking-wide">Video Complete</p>
            </div>
            <video
              src={job.finalVideoUrl}
              controls
              className="w-full rounded border border-edge"
            />
            <a
              href={job.finalVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-neon text-void rounded text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        )}

        {/* Failed */}
        {job.status === "failed" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <AlertCircle className="w-10 h-10 text-danger" style={{ filter: "drop-shadow(0 0 10px rgba(255, 51, 102, 0.4))" }} />
            <p className="text-danger font-medium uppercase tracking-wide">Job Failed</p>
            <p className="text-sm text-dim text-center max-w-md">
              {job.error || "An unknown error occurred"}
            </p>
            {job.frameUrl && job.characterImageUrl && (
              <button
                onClick={handleRegenerate}
                className="px-6 py-2.5 border border-edge hover:border-neon text-sm text-dim hover:text-neon rounded uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Regenerate confirmation modal */}
      <ConfirmModal
        open={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={handleRegenerate}
        title="Regenerate Image?"
        message="This will discard the current generated image and create a new one. The image generation will use credits from your FAL account."
        confirmLabel="Regenerate"
        cancelLabel="Keep Current"
      />

      {/* Image lightbox for full-screen viewing */}
      <ImageLightbox
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
