<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
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

    <!-- Center Prompt -->
    <div class="center-content pointer-events-none">
      <div class="jump-prompt-ring">
        <div class="glow-ring"></div>
        <span class="jump-text font-black uppercase tracking-wider">JUMP!</span>
        <span class="tap-hint text-purple-300 text-xs font-semibold uppercase mt-2 opacity-70">Tap screen</span>
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
        Watch the main screen and jump exactly when the obstacle crosses your avatar's target line!
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

  .center-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .jump-prompt-ring {
    position: relative;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border: 3px solid rgba(139, 92, 246, 0.4);
    background: rgba(15, 10, 25, 0.65);
    box-shadow: 0 0 35px rgba(139, 92, 246, 0.25),
                inset 0 0 25px rgba(139, 92, 246, 0.15);
    transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.2s, box-shadow 0.2s;
  }

  .pressed .jump-prompt-ring {
    transform: scale(0.9);
    border-color: rgba(236, 72, 153, 0.8);
    box-shadow: 0 0 45px rgba(236, 72, 153, 0.6),
                inset 0 0 30px rgba(236, 72, 153, 0.3);
  }

  .glow-ring {
    position: absolute;
    inset: -12px;
    border-radius: 50%;
    border: 2px dashed rgba(167, 139, 250, 0.4);
    animation: rotate 20s linear infinite;
    pointer-events: none;
    transition: border-color 0.2s;
  }
  
  .pressed .glow-ring {
    border-color: rgba(244, 114, 182, 0.6);
    animation-duration: 8s;
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .jump-text {
    font-size: 2.25rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(139, 92, 246, 0.8);
    transition: text-shadow 0.1s, color 0.1s;
  }

  .pressed .jump-text {
    color: #fff;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.8), 0 0 25px rgba(236, 72, 153, 1);
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
