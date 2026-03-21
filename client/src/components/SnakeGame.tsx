import { useRef, useEffect, useCallback, useState } from "react";
import { Trophy, Gamepad2 } from "lucide-react";

const STORAGE_KEY = "ezmo_snake_highscore";
const CELL = 14;
const COLS = 22;
const ROWS = 18;
const W = COLS * CELL;
const H = ROWS * CELL;
const TICK_MS = 100;

type Dir = [number, number];
const UP: Dir = [0, -1];
const DOWN: Dir = [0, 1];
const LEFT: Dir = [-1, 0];
const RIGHT: Dir = [1, 0];

function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(score));
  } catch {}
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 10, y: 9 }],
    dir: RIGHT as Dir,
    nextDir: RIGHT as Dir,
    food: { x: 16, y: 9 },
    score: 0,
    alive: true,
    started: false,
  });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(loadHighScore);
  const [alive, setAlive] = useState(true);
  const [started, setStarted] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval>>();

  const spawnFood = useCallback(() => {
    const s = stateRef.current;
    const occupied = new Set(s.snake.map((p) => `${p.x},${p.y}`));
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
    } while (occupied.has(`${x},${y}`));
    s.food = { x, y };
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.snake = [{ x: 10, y: 9 }];
    s.dir = RIGHT;
    s.nextDir = RIGHT;
    s.score = 0;
    s.alive = true;
    s.started = true;
    spawnFood();
    setScore(0);
    setAlive(true);
    setStarted(true);
  }, [spawnFood]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = stateRef.current;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, W, H);

    // Grid dots
    ctx.fillStyle = "#1a1a2a";
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 1);
      }
    }

    // Food — pulsing glow
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    ctx.shadowColor = "#ff3366";
    ctx.shadowBlur = 6 + pulse * 4;
    ctx.fillStyle = "#ff3366";
    ctx.beginPath();
    ctx.arc(
      s.food.x * CELL + CELL / 2,
      s.food.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    s.snake.forEach((seg, i) => {
      const isHead = i === 0;
      const alpha = 1 - (i / s.snake.length) * 0.5;
      if (isHead) {
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = isHead
        ? "#00ff88"
        : `rgba(0, 255, 136, ${alpha})`;
      ctx.fillRect(
        seg.x * CELL + 1,
        seg.y * CELL + 1,
        CELL - 2,
        CELL - 2
      );
      ctx.shadowBlur = 0;
    });

    // Death overlay
    if (!s.alive) {
      ctx.fillStyle = "rgba(10, 10, 15, 0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ff3366";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 8);
      ctx.fillStyle = "#6b7280";
      ctx.font = "11px monospace";
      ctx.fillText("Press any key to restart", W / 2, H / 2 + 14);
    }

    // Pre-start overlay
    if (!s.started) {
      ctx.fillStyle = "rgba(10, 10, 15, 0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Arrow keys to play", W / 2, H / 2);
    }
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.alive || !s.started) return;

    s.dir = s.nextDir;
    const head = s.snake[0];
    const nx = head.x + s.dir[0];
    const ny = head.y + s.dir[1];

    // Wall or self collision
    if (
      nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS ||
      s.snake.some((seg) => seg.x === nx && seg.y === ny)
    ) {
      s.alive = false;
      setAlive(false);
      if (s.score > loadHighScore()) {
        saveHighScore(s.score);
        setHighScore(s.score);
      }
      return;
    }

    s.snake.unshift({ x: nx, y: ny });

    if (nx === s.food.x && ny === s.food.y) {
      s.score++;
      setScore(s.score);
      spawnFood();
    } else {
      s.snake.pop();
    }
  }, [spawnFood]);

  // Game loop
  useEffect(() => {
    tickRef.current = setInterval(() => {
      tick();
      draw();
    }, TICK_MS);
    draw(); // initial draw
    return () => clearInterval(tickRef.current);
  }, [tick, draw]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const s = stateRef.current;

      if (!s.alive) {
        reset();
        e.preventDefault();
        return;
      }

      if (!s.started) {
        s.started = true;
        setStarted(true);
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
          if (s.dir !== DOWN) s.nextDir = UP;
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
          if (s.dir !== UP) s.nextDir = DOWN;
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
          if (s.dir !== RIGHT) s.nextDir = LEFT;
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
          if (s.dir !== LEFT) s.nextDir = RIGHT;
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <div className="flex items-center gap-2 text-[11px] text-dim uppercase tracking-widest">
        <Gamepad2 className="w-3.5 h-3.5" />
        Snake while you wait
      </div>
      <div className="rounded border border-edge overflow-hidden" style={{ lineHeight: 0 }}>
        <canvas ref={canvasRef} width={W} height={H} />
      </div>
      <div className="flex items-center gap-4 text-[11px] font-mono">
        <span className="text-neon">{score}</span>
        <span className="flex items-center gap-1 text-dim/60">
          <Trophy className="w-3 h-3" />
          {highScore}
        </span>
      </div>
    </div>
  );
}
