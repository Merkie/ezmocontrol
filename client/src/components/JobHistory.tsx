import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Trash2,
  Image,
  Video,
} from "lucide-react";
import type { Job, JobStatus } from "../types";

interface Props {
  jobs: Job[];
  activeJobId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function StatusIcon({ status }: { status: JobStatus }) {
  switch (status) {
    case "complete":
      return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    case "failed":
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    case "awaiting_approval":
      return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
    default:
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
  }
}

function statusLabel(status: JobStatus): string {
  switch (status) {
    case "uploading":
      return "Uploading";
    case "extracting_frame":
      return "Extracting";
    case "generating_image":
      return "Gen. Image";
    case "awaiting_approval":
      return "Review";
    case "generating_video":
      return "Gen. Video";
    case "complete":
      return "Complete";
    case "failed":
      return "Failed";
  }
}

export default function JobHistory({ jobs, activeJobId, onSelect, onDelete }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-600 text-sm">
        No jobs yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800/50">
      {jobs.map((job) => (
        <button
          key={job.id}
          onClick={() => onSelect(job.id)}
          className={`w-full p-3 text-left hover:bg-zinc-800/50 transition-colors group ${
            activeJobId === job.id ? "bg-zinc-800/70" : ""
          }`}
        >
          <div className="flex items-start gap-2.5">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
              {job.generatedImageUrl ? (
                <img
                  src={job.generatedImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : job.finalVideoUrl ? (
                <Video className="w-4 h-4 text-zinc-500" />
              ) : (
                <Image className="w-4 h-4 text-zinc-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <StatusIcon status={job.status} />
                <span className="text-xs text-zinc-400">
                  {statusLabel(job.status)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">
                {new Date(job.createdAt).toLocaleDateString()}{" "}
                {new Date(job.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job.id);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-all"
            >
              <Trash2 className="w-3 h-3 text-zinc-500" />
            </button>
          </div>
        </button>
      ))}
    </div>
  );
}
