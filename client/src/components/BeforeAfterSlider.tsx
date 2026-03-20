import { useRef, useCallback } from "react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const beforeLabelRef = useRef<HTMLDivElement>(null);
  const afterLabelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));

    if (clipRef.current) clipRef.current.style.width = `${pct}%`;
    if (lineRef.current) lineRef.current.style.left = `${pct}%`;
    if (beforeLabelRef.current) beforeLabelRef.current.style.opacity = pct > 10 ? "1" : "0";
    if (afterLabelRef.current) afterLabelRef.current.style.opacity = pct < 90 ? "1" : "0";
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-lg border border-zinc-800 cursor-col-resize"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* After image (full, bottom layer) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="block w-full"
        draggable={false}
      />

      {/* Before image (clipped, top layer) */}
      <div
        ref={clipRef}
        className="absolute inset-0 overflow-hidden"
        style={{ width: "50%" }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="block h-full object-cover object-left"
          style={{ width: containerRef.current?.offsetWidth ?? "100%" }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        ref={lineRef}
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-zinc-800"
          >
            <path
              d="M5 3L2 8L5 13M11 3L14 8L11 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div
        ref={beforeLabelRef}
        className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium bg-black/60 backdrop-blur-sm transition-opacity"
      >
        {beforeLabel}
      </div>
      <div
        ref={afterLabelRef}
        className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium bg-black/60 backdrop-blur-sm transition-opacity"
      >
        {afterLabel}
      </div>
    </div>
  );
}
