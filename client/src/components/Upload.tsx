import { useState, useRef, useCallback } from "react";
import { Upload as UploadIcon, Film, Image, X } from "lucide-react";
import type { Job, Dimensions } from "../types";
import { IMAGE_MODELS } from "../lib/constants";
import * as api from "../lib/api";

interface Props {
  apiKey: string;
  createJob: (data: Partial<Job>) => string;
  updateJob: (id: string, updates: Partial<Job>) => void;
  onJobCreated: (id: string) => void;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error("Invalid video file"));
    video.src = URL.createObjectURL(file);
  });
}

function getVideoDimensions(file: File): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => reject(new Error("Invalid video file"));
    video.src = URL.createObjectURL(file);
  });
}

function getImageDimensions(file: File): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error("Invalid image file"));
    img.src = URL.createObjectURL(file);
  });
}

export default function Upload({
  apiKey,
  createJob,
  updateJob,
  onJobCreated,
}: Props) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [characterFile, setCharacterFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [characterPreviewUrl, setCharacterPreviewUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = useCallback(async (file: File) => {
    setVideoError(null);
    if (!file.type.startsWith("video/mp4") && !file.name.endsWith(".mp4")) {
      setVideoError("Please upload an MP4 file");
      return;
    }
    try {
      const duration = await getVideoDuration(file);
      if (duration > 10) {
        setVideoError(`Video is ${duration.toFixed(1)}s — must be 10s or less`);
        return;
      }
    } catch {
      setVideoError("Could not read video file");
      return;
    }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleCharacterSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }
    setCharacterFile(file);
    setCharacterPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "video" | "image") => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (type === "video") handleVideoSelect(file);
      else handleCharacterSelect(file);
    },
    [handleVideoSelect, handleCharacterSelect]
  );

  const handleStart = useCallback(async () => {
    if (!videoFile || !characterFile) return;
    setIsStarting(true);
    setStartError(null);

    try {
      const [frameDimensions, characterDimensions] = await Promise.all([
        getVideoDimensions(videoFile),
        getImageDimensions(characterFile),
      ]);

      const jobId = createJob({
        status: "uploading",
        selectedModel,
        frameDimensions,
        characterDimensions,
      });
      onJobCreated(jobId);

      // Upload both files in parallel
      const [videoResult, imageResult] = await Promise.all([
        api.uploadFile(videoFile, apiKey),
        api.uploadFile(characterFile, apiKey),
      ]);

      updateJob(jobId, {
        videoUrl: videoResult.url,
        characterImageUrl: imageResult.url,
        status: "extracting_frame",
      });

      // Extract first frame
      const frameResult = await api.extractFrame(videoResult.url, apiKey);
      updateJob(jobId, {
        frameUrl: frameResult.frameUrl,
        status: "generating_image",
      });

      // Submit image generation
      const genResult = await api.generateImage(
        {
          frameUrl: frameResult.frameUrl,
          characterImageUrl: imageResult.url,
          model: selectedModel,
          frameDimensions,
          characterDimensions,
        },
        apiKey
      );

      updateJob(jobId, {
        imageRequestId: genResult.requestId,
        imageEndpoint: genResult.endpoint,
      });
    } catch (error: any) {
      setStartError(error.message || "Something went wrong");
      setIsStarting(false);
    }
  }, [
    videoFile,
    characterFile,
    selectedModel,
    apiKey,
    createJob,
    updateJob,
    onJobCreated,
  ]);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      <div>
        <h2 className="text-xl font-semibold">New Motion Control Job</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Upload a reference video and a character image to swap the person in
          the video.
        </p>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-2 gap-6">
        {/* Video upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Reference Video
          </label>
          <div
            onDrop={(e) => { handleDrop(e, "video"); setVideoDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setVideoDragOver(true)}
            onDragLeave={() => setVideoDragOver(false)}
            onClick={() => videoInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors min-h-[200px] ${
              videoDragOver
                ? "border-blue-500 bg-blue-500/10"
                : videoError
                  ? "border-red-500/50 bg-red-500/5"
                  : videoFile
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/30"
            }`}
          >
            {videoPreviewUrl ? (
              <>
                <video
                  src={videoPreviewUrl}
                  className="max-h-[140px] rounded-lg"
                  muted
                  playsInline
                  controls
                />
                <p className="text-xs text-zinc-400 truncate max-w-full">
                  {videoFile?.name}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                    setVideoError(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-zinc-800 rounded-md hover:bg-zinc-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <Film className="w-8 h-8 text-zinc-500" />
                <div className="text-center">
                  <p className="text-sm text-zinc-400">
                    Drop MP4 here or click to browse
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">Max 10 seconds</p>
                </div>
              </>
            )}
          </div>
          {videoError && (
            <p className="text-xs text-red-400">{videoError}</p>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoSelect(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* Character image upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">
            Character Image
          </label>
          <div
            onDrop={(e) => { handleDrop(e, "image"); setImageDragOver(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setImageDragOver(true)}
            onDragLeave={() => setImageDragOver(false)}
            onClick={() => imageInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors min-h-[200px] ${
              imageDragOver
                ? "border-blue-500 bg-blue-500/10"
                : characterFile
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/30"
            }`}
          >
            {characterPreviewUrl ? (
              <>
                <img
                  src={characterPreviewUrl}
                  alt="Character"
                  className="max-h-[140px] rounded-lg object-contain"
                />
                <p className="text-xs text-zinc-400 truncate max-w-full">
                  {characterFile?.name}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCharacterFile(null);
                    setCharacterPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1 bg-zinc-800 rounded-md hover:bg-zinc-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                <Image className="w-8 h-8 text-zinc-500" />
                <div className="text-center">
                  <p className="text-sm text-zinc-400">
                    Drop image here or click to browse
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    The character to swap in
                  </p>
                </div>
              </>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCharacterSelect(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Model selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">
          Image Generation Model
        </label>
        <div className="grid grid-cols-3 gap-3">
          {IMAGE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedModel === model.id
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30"
              }`}
            >
              <p className="text-sm font-medium">{model.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{model.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <div className="space-y-3">
        {startError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {startError}
          </div>
        )}
        <button
          onClick={handleStart}
          disabled={!videoFile || !characterFile || isStarting}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isStarting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4" />
              Start Job
            </>
          )}
        </button>
      </div>
    </div>
  );
}
