import { useEffect, useState, useCallback } from "react";
import { X, Download } from "lucide-react";

interface ImageLightboxProps {
  src: string | null;
  onClose: () => void;
}

const TRANSITION_DURATION = 200;

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [renderedSrc, setRenderedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (src) {
      setRenderedSrc(src);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        (cleanup as any).raf2 = raf2;
      });
      const cleanup = { raf2: 0 };
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(cleanup.raf2);
      };
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setRenderedSrc(null);
      }, TRANSITION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [src, onClose]);

  const handleDownload = useCallback(async () => {
    if (!renderedSrc) return;
    try {
      const response = await fetch(renderedSrc);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const urlParts = renderedSrc.split("/");
      link.download = urlParts[urlParts.length - 1].split("?")[0] || "image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(renderedSrc, "_blank");
    }
  }, [renderedSrc]);

  if (!renderedSrc) return null;

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        transition: isVisible
          ? "opacity 200ms, visibility 0s"
          : "opacity 200ms, visibility 0s 200ms",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* Image */}
      <div
        className={`relative max-h-[90vh] max-w-[90vw] transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <img
          src={renderedSrc}
          alt="Enlarged view"
          className="max-h-[90vh] max-w-[90vw] rounded border border-edge/50 object-contain shadow-2xl"
        />
      </div>

      {/* Controls */}
      <div
        className={`absolute right-4 top-4 flex gap-2 transition-all duration-200 ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <button
          onClick={handleDownload}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated/80 border border-edge text-haze transition-all hover:text-neon hover:glow-neon"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated/80 border border-edge text-haze transition-all hover:text-neon hover:glow-neon"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
