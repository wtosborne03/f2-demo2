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
  let score = 0;
  let scorePopText = "+100";
  let scoreTimeout: any;
  let wasHolding = false;

  function addPoints(amount: number) {
    score = Math.max(0, score + amount);
    gameClient.sendInput({ type: "scoreUpdate", score });

    if (amount > 0) {
      scorePopText = `+${amount}`;
    } else {
      scorePopText = `${amount}`;
    }
    showScorePop = true;
    scorePopClass = true;
    if (scoreTimeout) clearTimeout(scoreTimeout);
    scoreTimeout = setTimeout(() => {
      showScorePop = false;
      scorePopClass = false;
    }, 500);
  }

  const OBSTACLE_SPEED = 250;
  const TARGET_X = 60;
  const BASE_LINE_WIDTH = 4;

  const HIT_WINDOW = 0.08;
  const EARLY_HIT_WINDOW = 0.12;

  const LANE_COLORS = [
    "#22c55e", // Green
    "#ef4444", // Red
    "#eab308", // Yellow
    "#3b82f6", // Blue
    "#f97316"  // Orange
  ];
  const NEON_FILL_COLORS = [
    "rgba(34, 197, 94, 0.85)",
    "rgba(239, 68, 68, 0.85)",
    "rgba(234, 179, 8, 0.85)",
    "rgba(59, 130, 246, 0.85)",
    "rgba(249, 115, 22, 0.85)"
  ];

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
  let animationFrameId: number;
  let lastTimestamp = performance.now();

  interface Obstacle {
    id: number;
    startTime: number;
    endTime: number;
    lane: number;
    type: string;
    processed: { local?: "completed" | "missed" };
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

  // Fret buttons pressed state
  let buttonsPressed = [false, false, false, false, false];

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
          lane: Math.round(rawBeats[i + 2]),
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
            if (playhead > obs.startTime + HIT_WINDOW) {
              obs.processed.local = "missed";
            }
          } else if (status === "holding") {
            const isButtonHeld = buttonsPressed[obs.lane] === true;
            if (!isButtonHeld) {
              obs.processed.local = "missed";
            } else {
              // Add continuous points (+150 pts/sec)
              addPoints(Math.round(150 * deltaTime));

              // If we reached endTime, complete it and grant a +100 bonus
              if (playhead >= obs.endTime) {
                obs.processed.local = "completed";
                addPoints(100);
              }

              // Spawn particles at target line during hold!
              const newParticles: UnifiedParticle[] = [];
              const laneY = (obs.lane + 0.5) * (canvas.height / 5);
              const angle = Math.random() * Math.PI * 2;
              const speed = 2 + Math.random() * 2;
              newParticles.push({
                x: TARGET_X,
                y: laneY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                alpha: 0.9,
                color: LANE_COLORS[obs.lane],
                type: "circle",
                decay: 2.0,
              });
              canvasParticles = [...canvasParticles, ...newParticles];
            }
          }
        });
      }

      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const laneH = H / 5;

      ctx.fillStyle = "#171212";
      ctx.fillRect(0, 0, W, H);

      // Draw vertical grid lines (Guitar Hero fretboard style)
      if (playhead >= 0) {
        const gridSpacing = 0.5;
        const firstGridTime = Math.floor(playhead / gridSpacing) * gridSpacing;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.lineWidth = 1;
        for (
          let t = firstGridTime;
          t < playhead + W / OBSTACLE_SPEED;
          t += gridSpacing
        ) {
          const x = TARGET_X + (t - playhead) * OBSTACLE_SPEED;
          if (x > TARGET_X && x < W) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
          }
        }
      }

      // Draw neon target line (Guitar Hero strike bar vertical glow)
      ctx.strokeStyle = "rgba(168, 85, 247, 0.12)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(TARGET_X, 0);
      ctx.lineTo(TARGET_X, H);
      ctx.stroke();

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(TARGET_X, 0);
      ctx.lineTo(TARGET_X, H);
      ctx.stroke();

      // Draw Player highway separation lines
      for (let l = 1; l < 5; l++) {
        const lineY = l * laneH;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke();
      }

      // Draw standard base lane lines (glowing if button pressed)
      for (let l = 0; l < 5; l++) {
        const laneY = (l + 0.5) * laneH;
        const isPressed = buttonsPressed[l] === true;

        if (isPressed) {
          ctx.strokeStyle = `${LANE_COLORS[l]}55`;
          ctx.lineWidth = BASE_LINE_WIDTH + 2;
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
          ctx.lineWidth = BASE_LINE_WIDTH;
        }
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(W, laneY);
        ctx.stroke();
      }

      // Draw Target buttons for each lane
      for (let l = 0; l < 5; l++) {
        const laneY = (l + 0.5) * laneH;
        const isPressed = buttonsPressed[l] === true;
        const baseColor = LANE_COLORS[l];

        ctx.lineWidth = 3;
        if (isPressed) {
          ctx.fillStyle = baseColor;
          ctx.beginPath();
          ctx.arc(TARGET_X, laneY, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.beginPath();
          ctx.arc(TARGET_X, laneY, 14, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
          ctx.beginPath();
          ctx.arc(TARGET_X, laneY, 9, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = baseColor;
          ctx.beginPath();
          ctx.arc(TARGET_X, laneY, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Unified Particle System Engine updates
      if (!paused && canvasParticles.length > 0) {
        canvasParticles = canvasParticles.filter((p) => {
          p.x += p.vx * deltaTime * 60;
          p.y += p.vy * deltaTime * 60;

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

      // Draw Obstacles (rounded neon capsules with glossy inner cylinder look)
      if (playhead >= 0) {
        const drawGlossHighlight = (
          sx: number,
          ex: number,
          hVal: number,
          rads: any,
        ) => {
          ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(sx, centerY - hVal / 4, ex - sx, hVal / 2, rads);
          } else {
            ctx.rect(sx, centerY - hVal / 4, ex - sx, hVal / 2);
          }
          ctx.fill();
        };

        localObstacles.forEach((obs) => {
          const startX = TARGET_X + (obs.startTime - playhead) * OBSTACLE_SPEED;
          const endX = TARGET_X + (obs.endTime - playhead) * OBSTACLE_SPEED;

          if (endX < -40 || startX > W + 40) return;

          const h = 18;
          const r = h / 2;
          const centerY = (obs.lane + 0.5) * laneH;

          const status = obs.processed ? obs.processed.local : undefined;

          if (status === "completed") {
            // Successfully played notes disappear!
            return;
          }

          let drawnStartX = startX;
          let drawnEndX = endX;
          let fillStyle = NEON_FILL_COLORS[obs.lane];
          let strokeStyle = LANE_COLORS[obs.lane];

          if (status === "holding") {
            drawnStartX = TARGET_X;
            drawnEndX = endX;
            fillStyle = "rgba(34, 197, 94, 0.85)";
            strokeStyle = "#22c55e";
          } else if (status === "missed") {
            fillStyle = "rgba(100, 100, 100, 0.15)";
            strokeStyle = "rgba(150, 150, 150, 0.3)";
          }

          ctx.lineWidth = 2.5;
          ctx.fillStyle = fillStyle;
          ctx.strokeStyle = strokeStyle;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(drawnStartX, centerY - h / 2, drawnEndX - drawnStartX, h, r);
          } else {
            ctx.rect(drawnStartX, centerY - h / 2, drawnEndX - drawnStartX, h);
          }
          ctx.fill();
          ctx.stroke();

          drawGlossHighlight(drawnStartX, drawnEndX, h, r / 2);
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

  function handleFretDown(l: number, event: PointerEvent) {
    if (event.button !== 0) return;
    buttonsPressed[l] = true;
    buttonsPressed = [...buttonsPressed];

    gameClient.sendInput({ type: "buttonState", lane: l, pressed: true });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }

    // Tap timing validation
    const hasValidNote = localObstacles.some((obs) => {
      if (obs.lane !== l) return false;
      const status = obs.processed.local;
      if (status) return false;
      return (
        playhead >= obs.startTime - EARLY_HIT_WINDOW &&
        playhead <= obs.startTime + HIT_WINDOW
      );
    });

    if (hasValidNote) {
      localObstacles.forEach((obs) => {
        if (obs.lane !== l) return;
        if (!obs.processed.local) {
          if (
            playhead >= obs.startTime - EARLY_HIT_WINDOW &&
            playhead <= obs.startTime + HIT_WINDOW
          ) {
            const isHold = (obs.endTime - obs.startTime) > 0.25;
            if (isHold) {
              obs.processed.local = "holding";
            } else {
              obs.processed.local = "completed";
              addPoints(100);
            }

            // Spawn success particles
            const newParticles: UnifiedParticle[] = [];
            const laneH = canvas ? canvas.height / 5 : 44;
            const laneY = (l + 0.5) * laneH;
            for (let k = 0; k < 8; k++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 2 + Math.random() * 3;
              newParticles.push({
                x: TARGET_X,
                y: laneY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 5,
                alpha: 1.0,
                color: LANE_COLORS[l],
                type: Math.random() > 0.4 ? "circle" : "square",
                decay: 2.5,
              });
            }
            canvasParticles = [...canvasParticles, ...newParticles];
          }
        }
      });
    } else {
      addPoints(-50);

      // Trigger red warning particles
      const newParticles: UnifiedParticle[] = [];
      const laneH = canvas ? canvas.height / 5 : 44;
      const laneY = (l + 0.5) * laneH;
      for (let k = 0; k < 5; k++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2.0;
        newParticles.push({
          x: TARGET_X,
          y: laneY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4,
          alpha: 0.8,
          color: "#ef4444",
          type: "square",
          decay: 2.0,
        });
      }
      canvasParticles = [...canvasParticles, ...newParticles];
    }
  }

  function handleFretUp(l: number, event: PointerEvent) {
    if (!buttonsPressed[l]) return;
    buttonsPressed[l] = false;
    buttonsPressed = [...buttonsPressed];
    gameClient.sendInput({ type: "buttonState", lane: l, pressed: false });
  }

  function getNeonColor(type: string): { fill: string; stroke: string; glow: string } {
    return {
      fill: "rgba(168, 85, 247, 0.8)",
      stroke: "#a855f7",
      glow: "rgba(168, 85, 247, 0.4)",
    };
  }
</script>

<div class="gameplay-container text-white select-none beathop-play-page">
  <input
    type="checkbox"
    id="haptic-switch"
    {...{ switch: true }}
    class="haptic-checkbox"
  />

  <div class="flex flex-col w-full h-full justify-between items-center my-auto py-2">
    <!-- 5-Lane Canvas highway -->
    <div
      class="canvas-container relative w-full h-[220px] overflow-visible border-y border-white/5 pointer-events-none"
    >
      <canvas bind:this={canvas} class="w-full h-full block" />
    </div>

    <!-- 5 Colored Fret Buttons -->
    <div class="fret-buttons-container flex justify-around w-full max-w-md px-4 mt-6">
      {#each [0, 1, 2, 3, 4] as l}
        <button
          class="fret-button fret-button-{l} w-[68px] h-[68px] rounded-full border-4 flex items-center justify-center transition-all active:scale-90 duration-75"
          style="border-color: {LANE_COLORS[l]}; background-color: {buttonsPressed[l] ? LANE_COLORS[l] : 'rgba(28,22,22,0.6)'}; box-shadow: {buttonsPressed[l] ? `0 0 20px ${LANE_COLORS[l]}` : 'none'};"
          on:pointerdown={(e) => handleFretDown(l, e)}
          on:pointerup={(e) => handleFretUp(l, e)}
          on:pointercancel={(e) => handleFretUp(l, e)}
          on:pointerleave={(e) => handleFretUp(l, e)}
        >
          <div class="inner-circle w-6 h-6 rounded-full border-2 border-white/20" />
        </button>
      {/each}
    </div>
  </div>

  <div class="overlay-container pointer-events-none">
    <header
      class="w-full flex flex-col items-center gap-4 py-4 pointer-events-none"
    >
      <div class="track-card w-full max-w-md sm:max-w-xs">
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
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-music text-purple-400"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        {/if}
        <div class="flex-1 min-w-0">
          <span
            class="text-[10px] text-purple-400 font-bold uppercase tracking-widest block"
            >Now Playing</span
          >
          <h2 class="text-sm font-bold text-zinc-100 truncate mt-0.5">
            {$gameState.page_data?.title || "Music Video"}
          </h2>
        </div>
      </div>

      <div class="score-display">
        <span
          class="text-zinc-400 text-[10px] font-bold uppercase tracking-widest"
          >Your Score</span
        >
        <span
          class="score-number {score < 0
            ? 'text-rose-500'
            : 'text-emerald-400'}"
          class:pop={scorePopClass}
        >
          {score}
        </span>
        {#if showScorePop}
          <span class="score-pop">{scorePopText}</span>
        {/if}
      </div>
    </header>

    <footer class="py-2 text-center pointer-events-none">
      <p
        class="text-[11px] text-zinc-400 font-medium max-w-xs leading-relaxed bg-[#1c1616]/90 px-4 py-2 rounded-full border border-white/5 shadow-md"
      >
        Tap the 5 colored fret buttons exactly when notes cross the target line!
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
  :global(body:has(.beathop-play-page)) {
    background-color: #171212 !important;
  }

  .canvas-container {
    z-index: 5;
    background: #171212;
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
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(28, 22, 22, 0.85);
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .track-thumbnail {
    width: 56px;
    height: 42px;
    object-fit: cover;
    border-radius: 0.375rem;
  }

  .track-thumbnail-placeholder {
    width: 56px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(139, 92, 246, 0.1);
    border-radius: 0.375rem;
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .score-number {
    font-size: 3.5rem;
    font-weight: 900;
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

  .fret-buttons-container {
    z-index: 10;
  }

  .fret-button {
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .inner-circle {
    box-sizing: border-box;
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
