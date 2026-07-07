<script lang="ts">
  import { get } from "svelte/store";
  import {
    gameClient,
    gameState,
    serverTimeOffset,
  } from "$lib/wsapi/gameClient";
  import { onMount } from "svelte";

  let lastScore = 0;
  let isPressed = false;
  let showScorePop = false;
  let scorePopClass = false;

  $: score = $gameState.page_data?.roundScore || 0;

  // Snappy non-overlapping micro-timers for score bump
  $: {
    if (score > lastScore) {
      showScorePop = true;
      scorePopClass = true;
      const t = setTimeout(() => {
        showScorePop = false;
      }, 400);
      const t2 = setTimeout(() => {
        scorePopClass = false;
      }, 120);
      lastScore = score;
    } else if (score < lastScore) {
      lastScore = score;
    }
  }

  // Physics and logic constants matching host
  const JUMP_DURATION = 0.3;
  const JUMP_HEIGHT = 480;
  const OBSTACLE_SPEED = 250;
  const TARGET_X = 60;
  const BASE_LINE_WIDTH = 6;
  const SUCCESS_LINE_WIDTH_BOOST = 50;

  const HIT_WINDOW = 0.08;
  const EARLY_HIT_WINDOW = 0.12;

  const OBSTACLE_TYPES = [
    "STANDARD_NOTE",
    "LOW_WALL_JUMP",
    "HIGH_DODGE",
    "CENTER_VOCAL_ORB",
    "WIDE_BARRIER",
  ];
  function mapNumToType(num: number): string {
    const idx = Math.round(num);
    return OBSTACLE_TYPES[idx] || "STANDARD_NOTE";
  }

  let canvas: HTMLCanvasElement;
  let avatarEl: HTMLDivElement;
  let animationFrameId: number;
  let lastTimestamp = performance.now();
  let localJumpStartTime = -1;

  interface Obstacle {
    id: number;
    startTime: number;
    endTime: number;
    lane: number;
    type: string;
    processed: { local?: "holding" | "missed" | "completed" };
  }

  interface LanePulse {
    alpha: number;
    color: string;
    lineWidth: number;
  }

  interface UnifiedParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    type: "square" | "circle";
    decay: number;
  }

  let localObstacles: Obstacle[] = [];
  let pulses: LanePulse[] = [];
  let canvasParticles: UnifiedParticle[] = [];

  $: startTime = $gameState.page_data?.startTime || 0;
  $: paused = $gameState.page_data?.paused !== false;
  $: pausedTime = $gameState.page_data?.pausedTime || 0;
  $: laneIndex = $gameState.page_data?.laneIndex || 0;
  $: rawBeats = $gameState.page_data?.beats || [];

  $: {
    if (rawBeats && rawBeats.length > 0) {
      const decoded: Obstacle[] = [];
      for (let i = 0; i < rawBeats.length; i += 6) {
        decoded.push({
          id: i / 6 + 1,
          startTime: rawBeats[i],
          endTime: rawBeats[i + 1],
          lane: rawBeats[i + 2],
          type: mapNumToType(rawBeats[i + 3]),
          processed: {},
        });
      }
      localObstacles = decoded;
    } else {
      localObstacles = [];
    }
  }

  let playhead = 0;
  $: {
    if (paused) {
      playhead = pausedTime;
    }
  }

  function getNeonColor(type: string): { fill: string; stroke: string; glow: string } {
    switch (type) {
      case "WIDE_BARRIER":
        return { fill: "rgba(245, 158, 11, 0.8)", stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
      case "STANDARD_NOTE":
        return { fill: "rgba(168, 85, 247, 0.8)", stroke: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" };
      case "CENTER_VOCAL_ORB":
        return { fill: "rgba(6, 182, 212, 0.8)", stroke: "#06b6d4", glow: "rgba(6, 182, 212, 0.4)" };
      case "HIGH_DODGE":
        return { fill: "rgba(16, 185, 129, 0.8)", stroke: "#10b981", glow: "rgba(16, 185, 129, 0.4)" };
      case "LOW_WALL_JUMP":
        return { fill: "rgba(244, 63, 94, 0.8)", stroke: "#f43f5e", glow: "rgba(244, 63, 94, 0.4)" };
      default:
        return { fill: "rgba(168, 85, 247, 0.8)", stroke: "#a855f7", glow: "rgba(168, 85, 247, 0.4)" };
    }
  }

  let isHolding = false;

  onMount(() => {
    lastTimestamp = performance.now();

    const tick = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(tick);

      const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      if (!paused && startTime > 0) {
        playhead = (Date.now() + $serverTimeOffset - startTime) / 1000;
      }

      if (playhead > 0 && localObstacles.length > 0 && !paused) {
        localObstacles.forEach((obs) => {
          const status = obs.processed.local;

          if (!status) {
            if (isHolding && playhead >= obs.startTime - EARLY_HIT_WINDOW && playhead <= obs.startTime + HIT_WINDOW) {
              obs.processed.local = "holding";
              pulses = [
                {
                  alpha: 0.6,
                  color: "#4ade80",
                  lineWidth: BASE_LINE_WIDTH + SUCCESS_LINE_WIDTH_BOOST,
                },
              ];
              const newParticles: UnifiedParticle[] = [];
              for (let k = 0; k < 6; k++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 3;
                newParticles.push({
                  x: TARGET_X,
                  y: canvas ? canvas.height >> 1 : 110,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: 4 + Math.random() * 5,
                  alpha: 1.0,
                  color: "#86efac",
                  type: Math.random() > 0.4 ? "circle" : "square",
                  decay: 2.5,
                });
              }
              canvasParticles = [...canvasParticles, ...newParticles];
            } else if (playhead > obs.startTime + HIT_WINDOW) {
              obs.processed.local = "missed";
              pulses = [{ alpha: 0.4, color: "#ef4444", lineWidth: BASE_LINE_WIDTH }];
            }
          } else if (status === "holding") {
            if (isHolding) {
              if (Math.random() < 0.25) {
                const angle = (Math.random() - 0.5) * Math.PI * 0.5;
                const speed = 1.5 + Math.random() * 2.0;
                canvasParticles = [
                  ...canvasParticles,
                  {
                    x: TARGET_X,
                    y: canvas ? canvas.height >> 1 : 110,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 3,
                    alpha: 0.8,
                    color: "#86efac",
                    type: "circle",
                    decay: 3.0,
                  },
                ];
              }

              if (playhead >= obs.endTime) {
                obs.processed.local = "completed";
                const newParticles: UnifiedParticle[] = [];
                for (let k = 0; k < 10; k++) {
                  const angle = Math.random() * Math.PI * 2;
                  const speed = 3 + Math.random() * 3;
                  newParticles.push({
                    x: TARGET_X,
                    y: canvas ? canvas.height >> 1 : 110,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 5 + Math.random() * 6,
                    alpha: 1.0,
                    color: "#4ade80",
                    type: Math.random() > 0.3 ? "circle" : "square",
                    decay: 2.0,
                  });
                }
                canvasParticles = [...canvasParticles, ...newParticles];
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate([40, 30, 40]);
                }
              }
            } else {
              obs.processed.local = "missed";
              pulses = [{ alpha: 0.4, color: "#ef4444", lineWidth: BASE_LINE_WIDTH }];
              const newParticles: UnifiedParticle[] = [];
              for (let k = 0; k < 4; k++) {
                newParticles.push({
                  x: TARGET_X + (Math.random() - 0.5) * 15,
                  y: canvas ? canvas.height >> 1 : 110,
                  vx: -0.5 - Math.random() * 0.7,
                  vy: 1.0 + Math.random() * 1.0,
                  size: 4 + Math.random() * 3,
                  alpha: 0.9,
                  color: "#ef4444",
                  type: "square",
                  decay: 2.5,
                });
              }
              canvasParticles = [...canvasParticles, ...newParticles];
            }
          }
        });
      }

      if (avatarEl) {
        const isCurrentlyWinningHold = localObstacles.some(
          obs => obs.processed.local === "holding"
        );

        if (isHolding && isCurrentlyWinningHold) {
          const shakeX = (Math.random() - 0.5) * 6;
          const shakeY = (Math.random() - 0.5) * 6;
          const scale = 1.15 + Math.sin(timestamp * 0.05) * 0.05;
          avatarEl.style.transform = `translate3d(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px), 0) scale(${scale})`;
          avatarEl.style.filter = "drop-shadow(0 0 12px #4ade80)";
        } else {
          avatarEl.style.transform = `translate3d(-50%, -50%, 0) scale(1.0)`;
          avatarEl.style.filter = "none";
        }
      }

      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const centerY = H >> 1;

      ctx.fillStyle = "#0c0714";
      ctx.fillRect(0, 0, W, H);

      // Handle Lane FX Pulses
      if (!paused) {
        pulses = pulses.filter((pulse) => {
          pulse.alpha -= deltaTime * 2.0;
          if (pulse.alpha <= 0) return false;

          ctx.strokeStyle = pulse.color;
          ctx.globalAlpha = pulse.alpha;
          ctx.lineWidth = pulse.lineWidth;
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(W, centerY);
          ctx.stroke();

          ctx.fillStyle = pulse.color;
          ctx.globalAlpha = pulse.alpha * 0.15;
          ctx.fillRect(0, 0, W, H);

          return true;
        });
      }
      ctx.globalAlpha = 1.0;

      // Draw standard faint base lane line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = BASE_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(W, centerY);
      ctx.stroke();

      // Unified Particle System Engine updates
      if (!paused && canvasParticles.length > 0) {
        canvasParticles = canvasParticles.filter((p) => {
          p.x += p.vx * deltaTime * 60;
          p.y += p.vy * deltaTime * 60;

          if (p.vx !== -30 && p.color === "#86efac") {
            p.vy += deltaTime * 250;
          }

          p.alpha -= deltaTime * p.decay;
          if (p.alpha <= 0) return false;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;

          if (p.type === "circle") {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(
              p.x - p.size * 0.5,
              p.y - p.size * 0.5,
              p.size,
              p.size,
            );
          }
          return true;
        });
        ctx.globalAlpha = 1.0;
      }

      // Draw Obstacles (rounded neon capsules / hold trails)
      if (playhead > 0) {
        localObstacles.forEach((obs) => {
          const startX = TARGET_X + (obs.startTime - playhead) * OBSTACLE_SPEED;
          const endX = TARGET_X + (obs.endTime - playhead) * OBSTACLE_SPEED;

          if (endX < -40 || startX > W + 40) return;

          const h = 20; // Capsule height
          const r = h / 2;
          const colors = getNeonColor(obs.type);

          const status = obs.processed ? obs.processed.local : undefined;

          ctx.lineWidth = 2;

          if (status === "holding") {
            const midX = Math.max(TARGET_X, startX);
            
            // Held segment (Glowing Green)
            if (midX > startX) {
              ctx.fillStyle = "rgba(74, 222, 128, 0.75)";
              ctx.strokeStyle = "#4ade80";
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(startX, centerY - h / 2, midX - startX, h, [r, 0, 0, r]);
              } else {
                ctx.rect(startX, centerY - h / 2, midX - startX, h);
              }
              ctx.fill();
              ctx.stroke();
            }

            // Incoming segment (Original Color)
            if (endX > midX) {
              ctx.fillStyle = colors.fill;
              ctx.strokeStyle = colors.stroke;
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(midX, centerY - h / 2, endX - midX, h, [0, r, r, 0]);
              } else {
                ctx.rect(midX, centerY - h / 2, endX - midX, h);
              }
              ctx.fill();
              ctx.stroke();
            }
          } else if (status === "completed") {
            ctx.fillStyle = "rgba(74, 222, 128, 0.6)";
            ctx.strokeStyle = "#4ade80";
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(startX, centerY - h / 2, endX - startX, h, r);
            } else {
              ctx.rect(startX, centerY - h / 2, endX - startX, h);
            }
            ctx.fill();
            ctx.stroke();
          } else if (status === "missed") {
            ctx.fillStyle = "rgba(100, 100, 100, 0.2)";
            ctx.strokeStyle = "rgba(150, 150, 150, 0.4)";
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(startX, centerY - h / 2, endX - startX, h, r);
            } else {
              ctx.rect(startX, centerY - h / 2, endX - startX, h);
            }
            ctx.fill();
            ctx.stroke();
          } else {
            ctx.fillStyle = colors.fill;
            ctx.strokeStyle = colors.stroke;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(startX, centerY - h / 2, endX - startX, h, r);
            } else {
              ctx.rect(startX, centerY - h / 2, endX - startX, h);
            }
            ctx.fill();
            ctx.stroke();
          }
        });
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
      }
    });
    if (canvas) resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  });

  function handlePointerDown(event: PointerEvent) {
    if (event.target && (event.target as HTMLElement).id === "haptic-switch")
      return;

    isHolding = true;
    isPressed = true;

    gameClient.sendInput({ type: "hold", value: true });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isHolding) return;
    isHolding = false;
    isPressed = false;
    gameClient.sendInput({ type: "hold", value: false });
  }
</script>

<div class="gameplay-container text-white select-none">
  <input
    type="checkbox"
    id="haptic-switch"
    {...{ switch: true }}
    class="haptic-checkbox"
  />

  <label
    for="haptic-switch"
    class="fullscreen-jump-button"
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    onpointerleave={handlePointerUp}
    aria-label="Hold Button"
  >
    <div
      class="canvas-container relative w-full h-[220px] overflow-visible border-y border-white/5 my-auto pointer-events-none"
    >
      <canvas bind:this={canvas} class="w-full h-full block" />

      <div
        bind:this={avatarEl}
        class="absolute z-10 will-change-transform pointer-events-none"
        style="left: {TARGET_X}px; top: 50%;"
      >
        <div
          class="w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-150 {isHolding ? 'border-green-400 bg-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.8)] scale-110' : 'border-white/35 bg-white/5'}"
        >
          <div class="w-6 h-6 rounded-full border-2 {isHolding ? 'border-green-300' : 'border-white/20'}" />
        </div>
      </div>
    </div>
  </label>

  <div class="overlay-container pointer-events-none">
    <header
      class="w-full flex flex-col items-center gap-2 py-4 pointer-events-none"
    >
      <div class="track-card">
        {#if $gameState.page_data?.thumbnail}
          <img
            src={$gameState.page_data.thumbnail}
            alt="Video Thumbnail"
            class="track-thumbnail"
          />
        {:else}
          <div class="track-thumbnail-placeholder">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-purple-400"
              ><polygon points="23 7 16 12 23 17 23 7" /><rect
                x="1"
                y="5"
                width="15"
                height="14"
                rx="2"
                ry="2"
              /></svg
            >
          </div>
        {/if}
        <div class="flex-1 min-w-0">
          <span
            class="text-[9px] text-purple-400 font-bold uppercase tracking-widest block"
            >Now Playing</span
          >
          <h2 class="text-xs font-bold text-zinc-100 truncate mt-0.5">
            {$gameState.page_data?.title || "Music Video"}
          </h2>
        </div>
      </div>

      <div class="score-display">
        <span
          class="text-zinc-400 text-[10px] font-bold uppercase tracking-widest"
          >Your Score</span
        >
        <span class="score-number" class:pop={scorePopClass}>
          {score}
        </span>
        {#if showScorePop}
          <span class="score-pop">+100</span>
        {/if}
      </div>
    </header>

    <footer class="py-2 text-center pointer-events-none">
      <p
        class="text-[11px] text-zinc-400 font-medium max-w-xs leading-relaxed bg-black/60 px-4 py-2 rounded-full border border-white/5 shadow-md"
      >
        Hold the screen exactly when notes cross the target line, and release at the end!
      </p>
    </footer>
  </div>
</div>

<style>
  .haptic-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .gameplay-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: "Inter", system-ui, sans-serif;
  }

  .fullscreen-jump-button {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }

  .canvas-container {
    z-index: 5;
    /* Removed heavy CSS dynamic blur filters completely */
    background: #0c0714;
  }

  .overlay-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    box-sizing: border-box;
    z-index: 10;
  }

  .track-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: rgba(25zed, 25, 35, 0.6);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.05);
    width: 100%;
    max-width: 280px;
  }

  .track-thumbnail {
    width: 44px;
    height: 34px;
    object-fit: cover;
    border-radius: 0.25rem;
  }

  .track-thumbnail-placeholder {
    width: 44px;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 0.25rem;
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .score-number {
    font-size: 3rem;
    font-weight: 900;
    color: #f43f5e;
    /* Clean fallback coloring instead of text-fill clipping layers which cause repaints */
    transition: transform 0.1s ease-out;
    display: inline-block;
  }

  .score-number.pop {
    transform: scale(1.15);
  }

  .score-pop {
    position: absolute;
    right: -2.2rem;
    top: 1.2rem;
    color: #34d399;
    font-weight: 900;
    font-size: 1.2rem;
    animation: popUp 0.4s ease-out forwards;
  }

  @keyframes popUp {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.8);
    }
    30% {
      opacity: 1;
      transform: translateY(-2px) scale(1.05);
    }
    100% {
      opacity: 0;
      transform: translateY(-15px);
    }
  }
</style>
