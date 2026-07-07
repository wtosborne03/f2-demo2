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

  const HIT_WINDOW = 0.25;
  const EARLY_HIT_WINDOW = 0.6;

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
    hitTime: number;
    bass: number;
    vocals: number;
    treble: number;
    lane: number;
    type: string;
    speedMultiplier: number;
    processed: { local?: "dodged" | "hit" };
  }

  interface LanePulse {
    alpha: number;
    color: string;
    lineWidth: number;
  }

  // Consolidated canvas particle footprint
  interface UnifiedParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    type: "square" | "circle";
    isTapFX?: boolean;
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
          hitTime: rawBeats[i],
          bass: rawBeats[i + 1],
          vocals: rawBeats[i + 2],
          treble: rawBeats[i + 3],
          lane: laneIndex % 3,
          type: mapNumToType(rawBeats[i + 4]),
          speedMultiplier: rawBeats[i + 5],
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

      if (playhead > 0 && localObstacles.length > 0) {
        localObstacles.forEach((obs) => {
          if (!obs.processed.local && playhead > obs.hitTime + HIT_WINDOW) {
            obs.processed.local = "hit";
          }
        });
      }

      // Animate avatar (Using transform + will-change handles this outside normal layout layers)
      if (avatarEl) {
        let yOffset = 0;
        if (localJumpStartTime > 0 && playhead > 0) {
          const dt = playhead - localJumpStartTime;
          if (dt >= 0 && dt < JUMP_DURATION) {
            const u = dt / JUMP_DURATION;
            yOffset = JUMP_HEIGHT * u * (1 - u);
          } else {
            localJumpStartTime = -1;
          }
        }
        avatarEl.style.transform = `translate3d(-50%, calc(-50% - ${yOffset}px), 0)`;
      }

      if (!canvas) return;
      // Low-overhead frame backing
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const centerY = H >> 1;

      // Draw explicit solid background over clearRect to prevent composite redraw blending overhead
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

          // Performance hack: simplified single fill box fallback over linear canvas gradient
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

          if (p.isTapFX) {
            p.vy += 0.18 * 60 * deltaTime; // low-overhead gravity step
            p.vx *= 0.97;
          } else if (p.vx !== -30 && p.color === "#86efac") {
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

      // Draw Obstacles
      if (playhead > 0) {
        localObstacles.forEach((obs) => {
          const x = TARGET_X + (obs.hitTime - playhead) * OBSTACLE_SPEED;
          if (x < -40 || x > W + 40) return;

          const bass = obs.bass ?? 0.3;
          const vocals = obs.vocals ?? 0.3;
          const treble = obs.treble ?? 0.3;

          const isCeiling = treble > 0.6 && bass <= 0.7;
          const spikeH = 32 + 60 * (isCeiling ? treble : bass);
          const spikeW = 20 + 28 * vocals;
          const status = obs.processed ? obs.processed.local : undefined;

          if (status === "dodged") {
            ctx.fillStyle = "#4ade80";
            ctx.strokeStyle = "#22c55e";
          } else if (status === "hit") {
            ctx.fillStyle = "#f87171";
            ctx.strokeStyle = "#ef4444";
          } else {
            ctx.fillStyle = `rgb(${(130 + 125 * vocals) | 0}, ${(50 + 180 * bass) | 0}, ${(80 + 175 * treble) | 0})`;
            ctx.strokeStyle = "rgba(255,255,255,0.2)";
          }

          ctx.lineWidth = 2;
          ctx.beginPath();
          if (isCeiling) {
            const cy = centerY - 36;
            ctx.moveTo(x - spikeW, cy);
            ctx.quadraticCurveTo(
              x - spikeW * 0.5,
              cy + spikeH * 0.5,
              x,
              cy + spikeH,
            );
            ctx.quadraticCurveTo(
              x + spikeW * 0.5,
              cy + spikeH * 0.5,
              x + spikeW,
              cy,
            );
          } else {
            ctx.moveTo(x - spikeW, centerY);
            ctx.quadraticCurveTo(
              x - spikeW * 0.5,
              centerY - spikeH * 0.5,
              x,
              centerY - spikeH,
            );
            ctx.quadraticCurveTo(
              x + spikeW * 0.5,
              centerY - spikeH * 0.5,
              x + spikeW,
              centerY,
            );
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
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

  function checkLocalJump() {
    if (playhead <= 0 || localObstacles.length === 0) return;

    const nearbyObstacle = localObstacles.find((obs) => {
      if (obs.processed && obs.processed.local) return false;
      const diff = obs.hitTime - playhead;
      return diff >= 0
        ? diff <= EARLY_HIT_WINDOW
        : Math.abs(diff) <= HIT_WINDOW;
    });

    const centerY = canvas ? canvas.height >> 1 : 110;
    const newParticles: UnifiedParticle[] = [];

    if (nearbyObstacle) {
      if (!nearbyObstacle.processed) nearbyObstacle.processed = {};
      nearbyObstacle.processed.local = "dodged";

      pulses = [
        {
          alpha: 0.6,
          color: "#4ade80",
          lineWidth: BASE_LINE_WIDTH + SUCCESS_LINE_WIDTH_BOOST,
        },
      ];

      // Dropped maximum particle limits down for lightweight loop execution
      for (let k = 0; k < 10; k++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        newParticles.push({
          x: TARGET_X,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 6,
          alpha: 1.0,
          color: "#86efac",
          type: Math.random() > 0.4 ? "circle" : "square",
          decay: 2.5,
        });
      }
    } else {
      pulses = [{ alpha: 0.4, color: "#ef4444", lineWidth: BASE_LINE_WIDTH }];
      for (let k = 0; k < 4; k++) {
        newParticles.push({
          x: TARGET_X + (Math.random() - 0.5) * 15,
          y: centerY,
          vx: -0.5 - Math.random() * 0.7,
          vy: 1.0 + Math.random() * 1.0,
          size: 4 + Math.random() * 3,
          alpha: 0.9,
          color: "#ef4444",
          type: "square",
          decay: 2.5,
        });
      }
    }
    canvasParticles = [...canvasParticles, ...newParticles];
  }

  function spawnCanvasTapFX(x: number, y: number) {
    const colors = ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24"];
    const count = 8; // Dropped count from 14 to 8 elements
    const tapFX: UnifiedParticle[] = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        alpha: 1.0,
        type: "circle",
        isTapFX: true,
        decay: 1.8,
      };
    });

    canvasParticles = [...canvasParticles, ...tapFX];
  }

  function handleJump(event: MouseEvent | TouchEvent) {
    if (event.target && (event.target as HTMLElement).id === "haptic-switch")
      return;

    isPressed = true;
    setTimeout(() => {
      isPressed = false;
    }, 100);

    let clientX = 0;
    let clientY = 0;

    if (typeof TouchEvent !== "undefined" && event instanceof TouchEvent) {
      if (event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }
    } else if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    const rect = event.currentTarget
      ? (event.currentTarget as HTMLElement).getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };

    const x = clientX !== 0 ? clientX - rect.left : rect.width * 0.5;
    const y = clientY !== 0 ? clientY - rect.top : rect.height * 0.5;

    // Direct push down to shared non-DOM loop pipeline
    spawnCanvasTapFX(x, y);

    localJumpStartTime = playhead;
    checkLocalJump();

    gameClient.sendInput({ type: "jump" });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
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
    onclick={handleJump}
    aria-label="Jump Button"
  >
    <div
      class="canvas-container relative w-full h-[220px] overflow-visible border-y border-white/5 my-auto pointer-events-none"
    >
      <canvas bind:this={canvas} class="w-full h-full block" />

      <div
        bind:this={avatarEl}
        class="absolute z-10 will-change-transform"
        style="left: {TARGET_X}px; top: 50%;"
      >
        {#if $gameState.avatar?.selfieUrl}
          <img
            src={$gameState.avatar.selfieUrl}
            alt="Avatar"
            class="w-14 h-14 rounded-full object-cover border border-white/20 shadow-md"
          />
        {:else}
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center border border-white/30 bg-zinc-800 text-white text-xl font-extrabold"
          >
            {$gameState.name ? $gameState.name.charAt(0).toUpperCase() : "?"}
          </div>
        {/if}
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
        Tap screen to jump exactly when obstacles cross your target line!
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
