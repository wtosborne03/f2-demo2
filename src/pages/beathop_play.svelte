<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState, serverTimeOffset } from "$lib/wsapi/gameClient";
  import { onMount } from "svelte";

  let lastScore = 0;
  let isPressed = false;
  let showScorePop = false;
  let scorePopClass = false;

  $: score = $gameState.page_data?.roundScore || 0;

  // Pop score indicator when score increases
  $: {
    if (score > lastScore) {
      showScorePop = true;
      scorePopClass = true;
      const t = setTimeout(() => {
        showScorePop = false;
      }, 500);
      const t2 = setTimeout(() => {
        scorePopClass = false;
      }, 150);
      lastScore = score;
    } else if (score < lastScore) {
      lastScore = score; // Reset if new game/round
    }
  }

  // Visual effects state
  let ripples: Array<{ id: number; x: number; y: number }> = [];
  let particles: Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; size: number }> = [];
  let rippleId = 0;
  let particleId = 0;

  // Physics and logic constants matching host PlayScreen.tsx
  const JUMP_DURATION = 0.3;
  const JUMP_HEIGHT = 480; // Match host peak height (peak 120px)
  const OBSTACLE_SPEED = 250;
  const TARGET_X = 60;
  const BASE_LINE_WIDTH = 6;
  const SUCCESS_LINE_WIDTH_BOOST = 50;

  // Timing windows matching host
  const HIT_WINDOW = 0.25;
  const EARLY_HIT_WINDOW = 0.6;

  const OBSTACLE_TYPES = ["STANDARD_NOTE", "LOW_WALL_JUMP", "HIGH_DODGE", "CENTER_VOCAL_ORB", "WIDE_BARRIER"];
  function mapNumToType(num: number): string {
    const idx = Math.round(num);
    return OBSTACLE_TYPES[idx] || "STANDARD_NOTE";
  }

  // Local game loop states
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

  interface JumpParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    type: 'square' | 'circle';
  }

  let localObstacles: Obstacle[] = [];
  let pulses: LanePulse[] = [];
  let canvasParticles: JumpParticle[] = [];

  // Track reactive states from page_data
  $: startTime = $gameState.page_data?.startTime || 0;
  $: paused = $gameState.page_data?.paused !== false;
  $: pausedTime = $gameState.page_data?.pausedTime || 0;
  $: laneIndex = $gameState.page_data?.laneIndex || 0;
  $: rawBeats = $gameState.page_data?.beats || [];

  // Rebuild localObstacles on beats change
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

  // Playhead synchronization
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

      // Update playhead
      if (!paused && startTime > 0) {
        const currentServerTime = Date.now() + $serverTimeOffset;
        playhead = (currentServerTime - startTime) / 1000;
      }

      // 1. Auto-resolve passed obstacles that weren't hit/dodged locally
      if (playhead > 0 && localObstacles.length > 0) {
        localObstacles.forEach((obs) => {
          if (!obs.processed.local && playhead > obs.hitTime + HIT_WINDOW) {
            obs.processed.local = "hit";
          }
        });
      }

      // 2. Animate local avatar position (DOM translation)
      if (avatarEl) {
        let yOffset = 0;
        if (localJumpStartTime > 0 && playhead > 0) {
          const dt = playhead - localJumpStartTime;
          if (dt >= 0 && dt < JUMP_DURATION) {
            const u = dt / JUMP_DURATION;
            yOffset = JUMP_HEIGHT * u * (1 - u);
          } else {
            localJumpStartTime = -1; // reset when jump ends
          }
        }
        avatarEl.style.transform = `translate(-50%, -50%) translateY(-${yOffset}px)`;
      }

      // 3. Render phase
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const centerY = H / 2;

      ctx.clearRect(0, 0, W, H);

      // Handle Lane FX Pulses
      if (!paused) {
        pulses = pulses.filter(pulse => {
          pulse.alpha -= deltaTime * 1.8;
          if (pulse.alpha <= 0) return false;

          const hexAlpha = Math.floor(pulse.alpha * 255).toString(16).padStart(2, '0');
          const dynamicColor = `${pulse.color}${hexAlpha}`;

          // Draw lane line pulse
          ctx.strokeStyle = dynamicColor;
          ctx.lineWidth = pulse.lineWidth;
          ctx.beginPath();
          ctx.moveTo(0, centerY);
          ctx.lineTo(W, centerY);
          ctx.stroke();

          // Draw flash gradient
          const gradient = ctx.createLinearGradient(0, 0, 0, H);
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(0.5, `${pulse.color}${Math.floor(pulse.alpha * 120).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, "transparent");

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, W, H);

          return true;
        });
      }

      // Draw standard faint base lane line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = BASE_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(W, centerY);
      ctx.stroke();

      // Render Active Canvas Particles
      if (!paused) {
        canvasParticles = canvasParticles.filter(p => {
          p.x += p.vx * deltaTime * 60; // scale speeds to match host delta
          p.y += p.vy * deltaTime * 60;
          if (p.vx !== -30 && p.color === "#86efac") p.vy += deltaTime * 250;

          p.alpha -= deltaTime * 2.5;
          if (p.alpha <= 0) return false;

          ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;

          if (p.type === 'circle') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
          return true;
        });
      }

      // Draw Obstacles
      if (playhead > 0) {
        localObstacles.forEach((obs) => {
          const x = TARGET_X + (obs.hitTime - playhead) * OBSTACLE_SPEED;
          if (x < -50 || x > W + 50) return;

          const bass = obs.bass ?? 0.3;
          const vocals = obs.vocals ?? 0.3;
          const treble = obs.treble ?? 0.3;

          const isCeiling = treble > 0.6 && bass <= 0.7;
          const spikeH = 32 + 60 * (isCeiling ? treble : bass);
          const spikeW = 20 + 28 * vocals;

          const status = obs.processed ? obs.processed.local : undefined;

          if (status === "dodged") {
            ctx.strokeStyle = "rgba(74, 222, 128, 0.9)";
            ctx.fillStyle = "rgba(74, 222, 128, 0.85)";
          } else if (status === "hit") {
            ctx.strokeStyle = "rgba(248, 113, 113, 0.9)";
            ctx.fillStyle = "rgba(248, 113, 113, 0.85)";
          } else {
            const r = (130 + 125 * vocals) | 0;
            const g = (50 + 180 * bass) | 0;
            const b = (80 + 175 * treble) | 0;
            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
          }

          ctx.lineWidth = 3;
          ctx.beginPath();

          if (isCeiling) {
            const cy = centerY - 36;
            ctx.moveTo(x - spikeW, cy);
            ctx.quadraticCurveTo(x - spikeW / 2, cy + spikeH / 2, x, cy + spikeH);
            ctx.quadraticCurveTo(x + spikeW / 2, cy + spikeH / 2, x + spikeW, cy);
          } else {
            ctx.moveTo(x - spikeW, centerY);
            ctx.quadraticCurveTo(x - spikeW / 2, centerY - spikeH / 2, x, centerY - spikeH);
            ctx.quadraticCurveTo(x + spikeW / 2, centerY - spikeH / 2, x + spikeW, centerY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    // Resize observer to auto-resize canvas
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
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

    // Find nearby obstacle matching hit windows
    const nearbyObstacle = localObstacles.find(obs => {
      if (obs.processed && obs.processed.local) return false;

      const diff = obs.hitTime - playhead;
      if (diff >= 0) {
        return diff <= EARLY_HIT_WINDOW;
      } else {
        return Math.abs(diff) <= HIT_WINDOW;
      }
    });

    const centerY = canvas ? canvas.height / 2 : 110;

    if (nearbyObstacle) {
      if (!nearbyObstacle.processed) nearbyObstacle.processed = {};
      nearbyObstacle.processed.local = "dodged";

      // Replicate PlayScreen.tsx dramatic success FX
      pulses = [...pulses, {
        alpha: 0.6,
        color: "#4ade80",
        lineWidth: BASE_LINE_WIDTH + SUCCESS_LINE_WIDTH_BOOST
      }];

      const newParticles: JumpParticle[] = [];
      const particleColor = "#86efac";
      for (let k = 0; k < 15; k++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3.5; // Scaled down slightly for mobile
        newParticles.push({
          x: TARGET_X,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 8,
          alpha: 1.0,
          color: particleColor,
          type: Math.random() > 0.4 ? 'circle' : 'square'
        });
      }
      canvasParticles = [...canvasParticles, ...newParticles];
    } else {
      // Missed jump FX
      pulses = [...pulses, {
        alpha: 0.35,
        color: "#ef4444",
        lineWidth: BASE_LINE_WIDTH
      }];

      const newParticles: JumpParticle[] = [];
      for (let k = 0; k < 5; k++) {
        newParticles.push({
          x: TARGET_X + (Math.random() - 0.5) * 20,
          y: centerY,
          vx: -0.5 - Math.random() * 0.7,
          vy: 1.0 + Math.random() * 1.0,
          size: 4 + Math.random() * 4,
          alpha: 0.9,
          color: "#ef4444",
          type: 'square'
        });
      }
      canvasParticles = [...canvasParticles, ...newParticles];
    }
  }

  function spawnParticles(x: number, y: number) {
    const colors = ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#ec4899", "#22d3ee"];
    const count = 14;
    const newParticles = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      return {
        id: particleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // Slight upward bias
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 5
      };
    });

    particles = [...particles, ...newParticles];

    let ticks = 0;
    function update() {
      if (ticks >= 40) {
        particles = particles.filter(p => !newParticles.some(np => np.id === p.id));
        return;
      }
      
      particles = particles.map(p => {
        if (newParticles.some(np => np.id === p.id)) {
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.18, // gravity
            vx: p.vx * 0.97, // friction
            size: Math.max(0.5, p.size - 0.12)
          };
        }
        return p;
      });
      
      ticks++;
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function handleJump(event: MouseEvent | TouchEvent) {
    if (event.target && (event.target as HTMLElement).id === "haptic-switch") {
      return;
    }
    isPressed = true;
    setTimeout(() => {
      isPressed = false;
    }, 120);

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
      : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    
    const x = clientX !== 0 ? clientX - rect.left : rect.width / 2;
    const y = clientY !== 0 ? clientY - rect.top : rect.height / 2;

    // Spawn ripple
    const rid = rippleId++;
    ripples = [...ripples, { id: rid, x, y }];
    setTimeout(() => {
      ripples = ripples.filter((r) => r.id !== rid);
    }, 600);

    // Spawn particles
    spawnParticles(x, y);

    // Local jump timeline trigger
    localJumpStartTime = playhead;
    checkLocalJump();

    // Send high-priority jump input to the host
    gameClient.sendInput({
      type: "jump"
    });

    // Provide haptic feedback if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(35);
    }
  }
</script>

<div class="gameplay-container text-white select-none">
  <!-- Hidden iOS Switch for Haptic Hack -->
  <input type="checkbox" id="haptic-switch" {...{switch: true}} class="haptic-checkbox" />

  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- Fullscreen Interactive Tap Zone (Label mapping to haptic checkbox) -->
  <label 
    for="haptic-switch"
    class="fullscreen-jump-button"
    class:pressed={isPressed}
    onclick={handleJump}
    aria-label="Jump Button"
  >
    <div class="grid-overlay"></div>
    <div class="glow-radial"></div>
    
    {#each ripples as ripple (ripple.id)}
      <div 
        class="ripple-effect" 
        style="left: {ripple.x}px; top: {ripple.y}px;"
      ></div>
    {/each}

    {#each particles as p (p.id)}
      <div 
        class="particle" 
        style="left: {p.x}px; top: {p.y}px; width: {p.size}px; height: {p.size}px; color: {p.color};"
      ></div>
    {/each}

    <!-- Real-time Obstacle Track replicating PlayScreen -->
    <div class="canvas-container relative w-full h-[220px] overflow-visible border-y border-white/10 bg-black/40 backdrop-blur-md my-auto pointer-events-none">
      <canvas bind:this={canvas} class="w-full h-full block" />
      
      <!-- Jumping Avatar -->
      <div
        bind:this={avatarEl}
        class="absolute z-10 will-change-transform"
        style="left: {TARGET_X}px; top: 50%;"
      >
        {#if $gameState.avatar?.selfieUrl}
          <img
            src={$gameState.avatar.selfieUrl}
            alt="Avatar"
            class="w-14 h-14 rounded-full object-cover border-2 shadow-lg"
            style="border-color: {$gameState.color || '#a78bfa'};"
          />
        {:else}
          <div
            class="w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-lg text-white text-xl font-extrabold"
            style="background-color: {$gameState.color || '#6b7280'}; border-color: rgba(255,255,255,0.4);"
          >
            {$gameState.name ? $gameState.name.charAt(0).toUpperCase() : "?"}
          </div>
        {/if}
      </div>
    </div>
  </label>

  <!-- Overlay UI (Header and Footer overlaying the tap zone) -->
  <div class="overlay-container pointer-events-none">
    <!-- Top Header -->
    <header class="w-full flex flex-col items-center gap-4 py-4 pointer-events-none">
      <!-- Glassmorphic Track Card -->
      <div class="track-card">
        {#if $gameState.page_data?.thumbnail}
          <img src={$gameState.page_data.thumbnail} alt="Video Thumbnail" class="track-thumbnail" />
        {:else}
          <div class="track-thumbnail-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple-400"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </div>
        {/if}
        <div class="flex-1 min-w-0">
          <span class="text-[9px] text-purple-400 font-bold uppercase tracking-widest block">Now Playing</span>
          <h2 class="text-xs font-bold text-zinc-100 truncate mt-0.5">{$gameState.page_data?.title || "Music Video"}</h2>
        </div>
      </div>
      
      <!-- Score Display -->
      <div class="score-display">
        <span class="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Your Score</span>
        <span class="score-number" class:pop={scorePopClass}>
          {score}
        </span>
        {#if showScorePop}
          <span class="score-pop">
            +100
          </span>
        {/if}
      </div>
    </header>

    <!-- Bottom Tip -->
    <footer class="py-2 text-center pointer-events-none">
      <p class="text-[11px] text-zinc-400 font-medium max-w-xs leading-relaxed bg-black/45 px-4 py-2.5 rounded-full border border-white/5 shadow-lg backdrop-blur-md">
        Tap the screen to jump exactly when the obstacle crosses your avatar's target line!
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
    margin: 0;
  }

  .gameplay-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, #180b30 0%, #07040d 100%);
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .fullscreen-jump-button {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    transition: background-color 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px);
    background-size: 50px 50px;
    background-position: center;
    transform: perspective(500px) rotateX(60deg) translateY(-30%) scale(2);
    transform-origin: top center;
    opacity: 0.6;
    transition: transform 0.3s ease, opacity 0.3s ease;
    pointer-events: none;
  }

  .pressed .grid-overlay {
    opacity: 0.95;
    transform: perspective(500px) rotateX(55deg) translateY(-28%) scale(2.05);
  }

  .glow-radial {
    position: absolute;
    width: 120vw;
    height: 120vw;
    max-width: 800px;
    max-height: 800px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(236, 72, 153, 0.07) 45%, transparent 70%);
    pointer-events: none;
    transform: scale(1);
    animation: pulse-glow 4s ease-in-out infinite alternate;
    transition: transform 0.1s ease, background 0.1s ease;
  }

  .pressed .glow-radial {
    transform: scale(1.12);
    background: radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, rgba(139, 92, 246, 0.12) 50%, transparent 70%);
  }

  @keyframes pulse-glow {
    0% {
      transform: scale(0.95);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.05);
      opacity: 1;
    }
  }

  .canvas-container {
    position: relative;
    width: 100%;
    height: 220px;
    margin-top: auto;
    margin-bottom: auto;
    overflow: visible;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 5;
  }

  .ripple-effect {
    position: absolute;
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(236, 72, 153, 0.3) 50%, rgba(139, 92, 246, 0) 70%);
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%) scale(1);
    animation: ripple-out 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
  }

  @keyframes ripple-out {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(12);
      opacity: 0;
    }
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 10px currentColor;
    will-change: transform, opacity;
    background-color: currentColor;
  }

  .overlay-container {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    pointer-events: none;
    box-sizing: border-box;
    z-index: 10;
  }

  .track-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
    width: 100%;
    max-width: 320px;
    margin-bottom: 0.5rem;
    transition: border-color 0.3s, box-shadow 0.3s;
  }

  .track-thumbnail {
    width: 56px;
    height: 42px;
    object-fit: cover;
    border-radius: 0.375rem;
    border: 1px solid rgba(139, 92, 246, 0.3);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
  }

  .track-thumbnail-placeholder {
    width: 56px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(139, 92, 246, 0.2);
    border-radius: 0.375rem;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 0.5rem;
    position: relative;
  }

  .score-number {
    font-size: 3.5rem;
    font-weight: 900;
    background: linear-gradient(to right, #a78bfa, #ec4899, #f43f5e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 10px rgba(236, 72, 153, 0.2));
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: inline-block;
  }

  .score-number.pop {
    transform: scale(1.25);
    filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.6));
  }

  .score-pop {
    position: absolute;
    right: -2.5rem;
    top: 1.5rem;
    color: #34d399;
    font-weight: 900;
    font-size: 1.5rem;
    text-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
    animation: popUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes popUp {
    0% {
      opacity: 0;
      transform: translateY(15px) scale(0.6);
    }
    30% {
      opacity: 1;
      transform: translateY(-5px) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translateY(-25px) scale(0.8);
    }
  }
</style>
