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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
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

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

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
      className={`fixed inset-0 z-[300] flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        transition: isVisible
          ? "opacity 200ms, visibility 0s"
          : "opacity 200ms, visibility 0s 200ms",
      }}
      onClick={handleBackdrop}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Image */}
      <div
        className={`relative max-h-[90vh] max-w-[90vw] transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <img
          src={renderedSrc}
          alt="Enlarged view"
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
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
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
