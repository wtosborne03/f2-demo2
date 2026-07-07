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

  function addPoints(amount: number, isContinuous = false) {
    score = Math.max(0, score + amount);
    gameClient.sendInput({ type: "scoreUpdate", score });

    if (!isContinuous) {
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
    } else {
      scorePopClass = true;
      scorePopText = `+${amount}`;
      showScorePop = true;
      if (scoreTimeout) clearTimeout(scoreTimeout);
      scoreTimeout = setTimeout(() => {
        showScorePop = false;
        scorePopClass = false;
      }, 300);
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
  let holdDurationTracker = 0;

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

  function getNeonColor(type: string): {
    fill: string;
    stroke: string;
    glow: string;
  } {
    switch (type) {
      case "WIDE_BARRIER":
        return {
          fill: "rgba(245, 158, 11, 0.8)",
          stroke: "#f59e0b",
          glow: "rgba(245, 158, 11, 0.4)",
        };
      case "STANDARD_NOTE":
        return {
          fill: "rgba(168, 85, 247, 0.8)",
          stroke: "#a855f7",
          glow: "rgba(168, 85, 247, 0.4)",
        };
      case "CENTER_VOCAL_ORB":
        return {
          fill: "rgba(6, 182, 212, 0.8)",
          stroke: "#06b6d4",
          glow: "rgba(6, 182, 212, 0.4)",
        };
      case "HIGH_DODGE":
        return {
          fill: "rgba(16, 185, 129, 0.8)",
          stroke: "#10b981",
          glow: "rgba(16, 185, 129, 0.4)",
        };
      case "LOW_WALL_JUMP":
        return {
          fill: "rgba(244, 63, 94, 0.8)",
          stroke: "#f43f5e",
          glow: "rgba(244, 63, 94, 0.4)",
        };
      default:
        return {
          fill: "rgba(168, 85, 247, 0.8)",
          stroke: "#a855f7",
          glow: "rgba(168, 85, 247, 0.4)",
        };
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

      const isCurrentlyWinningHold = localObstacles.some(
        (obs) => obs.processed.local === "holding",
      );

      if (isHolding) {
        holdDurationTracker += deltaTime;
      } else {
        holdDurationTracker = 0;
      }

      // Local off-beat tap penalty check
      if (isHolding && !wasHolding && !paused) {
        const hasValidNote = localObstacles.some((obs) => {
          const status = obs.processed.local;
          if (status) return false;
          return (
            playhead >= obs.startTime - EARLY_HIT_WINDOW &&
            playhead <= obs.startTime + HIT_WINDOW
          );
        });

        if (!hasValidNote) {
          addPoints(-50);
        }
      }
      wasHolding = isHolding;

      // Add severe cascading penalty particle sparks if holding down off-beat
      if (isHolding && !isCurrentlyWinningHold && !paused) {
        if (Math.random() < 0.35) {
          const count = 2 + Math.floor(Math.random() * 3);
          const penaltyParticles: UnifiedParticle[] = [];
          for (let k = 0; k < count; k++) {
            penaltyParticles.push({
              x: TARGET_X + (Math.random() - 0.5) * 20,
              y: canvas
                ? (canvas.height >> 1) + (Math.random() - 0.5) * 30
                : 110,
              vx: -1.5 - Math.random() * 2.0,
              vy: (Math.random() - 0.5) * 4.0,
              size: 5 + Math.random() * 4,
              alpha: 1.0,
              color: "#f43f5e",
              type: "square",
              decay: 1.8 + Math.random() * 1.2,
            });
          }
          canvasParticles = [...canvasParticles, ...penaltyParticles];
        }
      }

      if (playhead > 0 && localObstacles.length > 0 && !paused) {
        localObstacles.forEach((obs) => {
          const status = obs.processed.local;

          if (!status) {
            if (
              isHolding &&
              playhead >= obs.startTime - EARLY_HIT_WINDOW &&
              playhead <= obs.startTime + HIT_WINDOW
            ) {
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
            } else if (
              playhead > obs.startTime + HIT_WINDOW &&
              status !== "holding"
            ) {
              obs.processed.local = "missed";
              pulses = [
                { alpha: 0.4, color: "#ef4444", lineWidth: BASE_LINE_WIDTH },
              ];
            }
          } else if (status === "holding") {
            if (isHolding) {
              // Continuous hold scoring (+150 pts/sec)
              addPoints(Math.round(150 * deltaTime), true);

              const newParticles: UnifiedParticle[] = [];
              for (let k = 0; k < 2; k++) {
                const angle = (Math.random() - 0.5) * Math.PI * 0.4;
                const durationScalar = Math.min(
                  1.0 + holdDurationTracker * 0.7,
                  2.5,
                );
                const speed = (2 + Math.random() * 3) * durationScalar;
                newParticles.push({
                  x: TARGET_X,
                  y: canvas ? canvas.height >> 1 : 110,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  size: (2 + Math.random() * 3) * (durationScalar * 0.8),
                  alpha: 0.8,
                  color: "#86efac",
                  type: "circle",
                  decay: Math.max(3.0 - holdDurationTracker * 0.3, 1.2),
                });
              }
              canvasParticles = [...canvasParticles, ...newParticles];

              if (playhead >= obs.endTime) {
                obs.processed.local = "completed";
                // Hold completion bonus (+100 pts)
                addPoints(100);

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
              pulses = [
                { alpha: 0.4, color: "#ef4444", lineWidth: BASE_LINE_WIDTH },
              ];
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
        if (isHolding && isCurrentlyWinningHold) {
          const shakeX = (Math.random() - 0.5) * 6;
          const shakeY = (Math.random() - 0.5) * 6;
          const scale = 1.15 + Math.sin(timestamp * 0.05) * 0.05;
          avatarEl.style.transform = `translate3d(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px), 0) scale(${scale})`;
          avatarEl.style.filter = "drop-shadow(0 0 12px #4ade80)";
        } else if (isHolding && !isCurrentlyWinningHold) {
          // Off-beat pulse rumble aesthetic adjustments
          const shakeX = (Math.random() - 0.5) * 4;
          const shakeY = (Math.random() - 0.5) * 4;
          avatarEl.style.transform = `translate3d(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px), 0) scale(0.96)`;
          avatarEl.style.filter = "drop-shadow(0 0 8px #f43f5e)";
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

      ctx.fillStyle = "#171212";
      ctx.fillRect(0, 0, W, H);

      // Draw vertical grid lines (Guitar Hero fretboard style)
      if (playhead > 0) {
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
          ctx.globalAlpha = pulse.alpha * 0.12;
          ctx.fillRect(0, 0, W, H);

          return true;
        });
      }
      ctx.globalAlpha = 1.0;

      // Draw standard faint base lane line (glowing green if player is holding)
      const isCurrentlyHolding = localObstacles.some(
        (obs) => obs.processed.local === "holding",
      );
      if (isCurrentlyHolding) {
        ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
        ctx.lineWidth = BASE_LINE_WIDTH + 4;
      } else if (isHolding && !isCurrentlyWinningHold) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
        ctx.lineWidth = BASE_LINE_WIDTH + 2;
      } else {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = BASE_LINE_WIDTH;
      }
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

      // Draw Obstacles (rounded neon capsules / hold trails with glossy inner cylinder look)
      if (playhead > 0) {
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
                ctx.roundRect(startX, centerY - h / 2, midX - startX, h, [
                  r,
                  0,
                  0,
                  r,
                ]);
              } else {
                ctx.rect(startX, centerY - h / 2, midX - startX, h);
              }
              ctx.fill();
              ctx.stroke();

              drawGlossHighlight(startX, midX, h, [r / 2, 0, 0, r / 2]);
            }

            // Incoming segment (Keep active neon green instead of flipping back to unhit colors)
            if (endX > midX) {
              ctx.fillStyle = "rgba(74, 222, 128, 0.45)";
              ctx.strokeStyle = "#4ade80";
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(midX, centerY - h / 2, endX - midX, h, [
                  0,
                  r,
                  r,
                  0,
                ]);
              } else {
                ctx.rect(midX, centerY - h / 2, endX - midX, h);
              }
              ctx.fill();
              ctx.stroke();

              drawGlossHighlight(midX, endX, h, [0, r / 2, r / 2, 0]);
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

            drawGlossHighlight(startX, endX, h, r / 2);
          } else if (status === "missed") {
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

            drawGlossHighlight(startX, endX, h, r / 2);
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

            drawGlossHighlight(startX, endX, h, r / 2);
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

<div class="gameplay-container text-white select-none beathop-play-page">
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
          class="w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-150 {isHolding
            ? localObstacles.some((obs) => obs.processed.local === 'holding')
              ? 'border-green-400 bg-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.8)] scale-110'
              : 'border-rose-500 bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.7)] scale-95'
            : laneIndex % 3 === 0
              ? 'border-purple-500 bg-purple-950/40 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
              : laneIndex % 3 === 1
                ? 'border-cyan-500 bg-cyan-950/40 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'border-rose-500 bg-rose-950/40 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}"
        >
          <div
            class="w-6 h-6 rounded-full border-2 {isHolding
              ? localObstacles.some((obs) => obs.processed.local === 'holding')
                ? 'border-green-300'
                : 'border-rose-300'
              : laneIndex % 3 === 0
                ? 'border-purple-300/40'
                : laneIndex % 3 === 1
                  ? 'border-cyan-300/40'
                  : 'border-rose-300/40'}"
          />
        </div>
      </div>
    </div>
  </label>

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
          <span class="score-pop">+100</span>
        {/if}
      </div>
    </header>

    <footer class="py-2 text-center pointer-events-none">
      <p
        class="text-[11px] text-zinc-400 font-medium max-w-xs leading-relaxed bg-[#1c1616]/90 px-4 py-2 rounded-full border border-white/5 shadow-md"
      >
        Hold the screen exactly when notes cross the target line, and release at
        the end!
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
