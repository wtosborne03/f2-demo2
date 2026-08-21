<script lang="ts">
  import { onMount } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { PromptDropData } from "../types/page_data";

  let pageData: PromptDropData = $derived(($gameState.page_data || {}) as PromptDropData);

  let title = $derived(pageData.title || "Song Element");
  let question = $derived(pageData.aspectQuestion || pageData.question || "Submit your best idea!");
  let placeholder = $derived(pageData.placeholder || "Type your idea here...");
  let aspectIndex = $derived(pageData.aspectIndex ?? 0);
  let aspectTotal = $derived(pageData.aspectTotal ?? 5);
  let celebrity = $derived(pageData.celebrity || "");
  let decree = $derived(pageData.decree || "");
  let fallbacks = $derived(pageData.fallbacks || []);

  let answer_text = $state("");
  let submitted = $state(false);
  let isDropping = $state(false);
  let dropAngle = $state(0);
  let cardPastelColor = $state("#fef08a");
  let starterChips = $state<string[]>([]);
  let particles = $state<Array<{ id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; rot: number }>>([]);

  const PASTEL_COLORS = [
    "#ffe4e6", // pastel rose
    "#fef08a", // pastel yellow
    "#bbf7d0", // pastel mint
    "#bfdbfe", // pastel sky blue
    "#fed7aa", // pastel peach
    "#e9d5ff", // pastel lavender
    "#c7d2fe", // pastel periwinkle
    "#a7f3d0", // pastel seafoam
    "#fbcfe8", // pastel bubblegum
    "#fef9c3", // pastel lemon
    "#e0e7ff", // pastel soft indigo
    "#ccfbf1", // pastel ice teal
  ];

  // Aspect icon picker
  const aspectIcons: Record<string, string> = {
    song_title: "🎵",
    subject: "💡",
    opening_line: "🎤",
    closing_line: "💥",
    style: "🎷",
  };

  let aspectIcon = $derived(
    (pageData.aspectKey && aspectIcons[pageData.aspectKey]) || "✨"
  );

  // Web Audio Synth for Drop Sound Effects
  let audioCtx: AudioContext | null = null;

  function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playDropSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Descending slide whistle / whoosh drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.38);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      // 2. Mechanical trapdoor latch snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = "square";
      snapOsc.frequency.setValueAtTime(920, now + 0.05);
      snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

      snapGain.gain.setValueAtTime(0.35, now + 0.05);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now + 0.05);
      snapOsc.stop(now + 0.14);

      // 3. Celebratory Chime Fanfare on Landing (0.42s)
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major arpeggio
      chord.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.type = "triangle";
        noteOsc.frequency.setValueAtTime(freq, now + 0.35 + idx * 0.06);

        noteGain.gain.setValueAtTime(0.3, now + 0.35 + idx * 0.06);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + idx * 0.06 + 0.35);

        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.start(now + 0.35 + idx * 0.06);
        noteOsc.stop(now + 0.35 + idx * 0.06 + 0.35);
      });
    } catch (e) {
      console.warn("Web audio error:", e);
    }
  }

  function playTapSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.06);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      // Ignore
    }
  }

  onMount(() => {
    // Pick pastel color based on aspect or random
    const idx = Math.abs(aspectIndex) % PASTEL_COLORS.length;
    cardPastelColor = PASTEL_COLORS[idx] || "#fef08a";

    // Sample 2 random starter chips from fallbacks
    if (fallbacks.length > 0) {
      const shuffled = [...fallbacks].sort(() => 0.5 - Math.random());
      starterChips = shuffled.slice(0, 2);
    }
  });

  function selectStarterChip(chipText: string) {
    playTapSound();
    if (navigator?.vibrate) navigator.vibrate(20);
    answer_text = chipText;
  }

  function pickSurpriseMe() {
    playTapSound();
    if (navigator?.vibrate) navigator.vibrate(25);
    if (fallbacks.length > 0) {
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      answer_text = randomFallback;
    }
  }

  function submit_prompt() {
    if (isDropping || submitted) return;
    const finalAnswer = answer_text.trim() || (fallbacks[0] ?? "Broadway Hit");

    // Random slight rotation angle for physics drop realism (-5deg to +5deg)
    dropAngle = (Math.random() - 0.5) * 12;
    isDropping = true;

    // Haptics & SFX
    if (navigator?.vibrate) {
      navigator.vibrate([40, 30, 80]);
    }
    playDropSound();

    // Spawn celebratory particles
    const confettiColors = ["#ffd700", "#ff007f", "#00f2fe", "#00ff88", "#ff6b00", "#ffffff"];
    particles = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 40,
      y: 65,
      vx: (Math.random() - 0.5) * 160,
      vy: -60 - Math.random() * 120,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      size: 6 + Math.random() * 8,
      rot: Math.random() * 360,
    }));

    // Send input to game server
    gameClient.sendInput({
      type: "promptTextData",
      answer: finalAnswer,
    });

    // Complete drop animation into submitted state
    setTimeout(() => {
      submitted = true;
      isDropping = false;
    }, 650);
  }
</script>

<div class="prompt-drop-root">
  <!-- Ambient Backdrop -->
  <div class="ambient-glow"></div>
  <div class="halftone-overlay"></div>

  <div class="prompt-drop-container">
    <!-- Header Marquee Bar -->
    <header class="header-bar">
      <div class="marquee-pill">
        <span class="star-icon">⭐</span>
        <span class="brand-text">HITMAKERS</span>
      </div>

      <div class="round-pill">
        ROUND {aspectIndex + 1}/{aspectTotal}
      </div>
    </header>

    <!-- Celebrity Demand Context Pill (if decree available) -->
    {#if decree}
      <div class="decree-banner">
        <span class="decree-tag">🎵 {celebrity ? `${celebrity.toUpperCase()}'S DEMAND` : "DEMAND"}:</span>
        <span class="decree-text">&ldquo;{decree}&rdquo;</span>
      </div>
    {/if}

    <!-- Main Content Area -->
    <main class="content-wrapper">
      {#if !submitted && !isDropping}
        <!-- PHASE 1: INPUT & COMPOSITION -->
        <div class="question-header">
          <div class="aspect-badge">
            <span class="aspect-icon">{aspectIcon}</span>
            <span class="aspect-name">{title.toUpperCase()}</span>
          </div>
          <h1 class="question-text">{question}</h1>
        </div>

        <!-- Quick Inspiration Chips -->
        {#if starterChips.length > 0}
          <div class="inspiration-row">
            <span class="inspiration-label">💡 QUICK IDEAS:</span>
            <div class="chips-container">
              {#each starterChips as chip}
                <button
                  type="button"
                  class="starter-chip"
                  onclick={() => selectStarterChip(chip)}
                >
                  <span class="chip-text truncate">{chip}</span>
                </button>
              {/each}
              <button
                type="button"
                class="starter-chip surprise-chip"
                onclick={pickSurpriseMe}
                title="Random Surprise"
              >
                🎲 Surprise Me
              </button>
            </div>
          </div>
        {/if}

        <!-- Interactive Idea Card to be Dropped -->
        <form
          class="idea-card-form"
          onsubmit={(e) => {
            e.preventDefault();
            submit_prompt();
          }}
        >
          <div
            class="idea-card-preview"
            style="--card-pastel-bg: {cardPastelColor};"
          >
            <div class="card-top-bar">
              <span class="card-category-label">YOUR {title.toUpperCase()}</span>
              <span class="card-char-count">{answer_text.length}/80</span>
            </div>

            <textarea
              class="card-textarea"
              placeholder={placeholder}
              bind:value={answer_text}
              maxlength={80}
              rows={3}
              required
            ></textarea>

            {#if answer_text}
              <button
                type="button"
                class="card-clear-btn"
                onclick={() => (answer_text = "")}
                aria-label="Clear text"
              >
                ✕
              </button>
            {/if}
          </div>

          <!-- The Mechanical Drop Chute Guide Line -->
          <div class="drop-chute-indicator">
            <div class="chute-arrow-down">▼</div>
            <span class="chute-label">PRESS BELOW TO DROP INTO THE HIT FACTORY</span>
            <div class="chute-arrow-down">▼</div>
          </div>

          <!-- Giant Juicy Submit Button -->
          <button
            type="submit"
            class="btn-drop-submit"
            disabled={!answer_text.trim()}
          >
            <span class="drop-icon">🍬</span>
            <span class="btn-text">DROP INTO HOPPER!</span>
            <span class="drop-arrow">➔</span>
          </button>
        </form>
      {:else if isDropping}
        <!-- PHASE 2: PHYSICAL DROP ANIMATION -->
        <div class="dropping-animation-stage">
          <div
            class="animated-dropping-card"
            style="--card-pastel-bg: {cardPastelColor}; --drop-rot: {dropAngle}deg;"
          >
            <div class="card-top-bar">
              <span class="card-category-label">{title.toUpperCase()}</span>
            </div>
            <div class="card-dropped-text">
              &ldquo;{answer_text || fallbacks[0] || "Broadway Hit"}&rdquo;
            </div>
          </div>

          <!-- Mechanical Trapdoor Opening -->
          <div class="trapdoor-tunnel">
            <div class="trapdoor-left"></div>
            <div class="trapdoor-light-beam"></div>
            <div class="trapdoor-right"></div>
          </div>

          <!-- Confetti & Sparks Burst -->
          {#each particles as p (p.id)}
            <div
              class="drop-particle"
              style="
                left: {p.x}%;
                top: {p.y}%;
                --vx: {p.vx}px;
                --vy: {p.vy}px;
                --p-color: {p.color};
                --p-size: {p.size}px;
                --p-rot: {p.rot}deg;
              "
            ></div>
          {/each}
        </div>
      {:else}
        <!-- PHASE 3: SUBMITTED CONFIRMATION / IN-HOPPER STATE -->
        <div class="submitted-hopper-state">
          <div class="confirmation-badge">
            <span class="check-icon">✓</span>
            <span class="badge-title">DROPPED INTO THE MIX!</span>
          </div>

          <!-- Mini Hopper Visual showing user's card in hopper -->
          <div class="mini-hopper-display">
            <div class="hopper-funnel-top">
              <span class="hopper-status-dot"></span>
              <span>HIT FACTORY HOPPER #{(aspectIndex + 1)}</span>
            </div>

            <div
              class="hopper-landed-card"
              style="--card-pastel-bg: {cardPastelColor};"
            >
              <div class="landed-card-header">{title.toUpperCase()}</div>
              <div class="landed-card-content">
                &ldquo;{answer_text || fallbacks[0] || "Broadway Hit"}&rdquo;
              </div>
            </div>

            <div class="hopper-gears-indicator">
              <span class="gear-anim">⚙️</span>
              <span class="hopper-hint">PHYSICS READY ON STAGE</span>
              <span class="gear-anim">⚙️</span>
            </div>
          </div>

          <!-- Look Up at TV Screen Callout -->
          <div class="tv-callout-card">
            <div class="tv-radar-pulse">
              <span class="tv-icon">📺</span>
            </div>
            <div class="tv-callout-text">
              <h3>LOOK UP AT THE TV SCREEN!</h3>
              <p>Watch your idea tumble into the arcade hopper with the other players!</p>
            </div>
          </div>

          <!-- Waiting for others -->
          <div class="waiting-footer">
            <span class="waiting-dots">
              <span>●</span><span>●</span><span>●</span>
            </span>
            <span class="waiting-label">Waiting for next round...</span>
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap');

  .prompt-drop-root {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    background-color: #120320;
    color: #ffffff;
    font-family: 'Fredoka', 'Outfit', system-ui, -apple-system, sans-serif;
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    padding: 1rem;
    user-select: none;
  }

  .ambient-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 10%, rgba(255, 0, 127, 0.22) 0%, transparent 60%),
      radial-gradient(circle at 20% 80%, rgba(0, 242, 254, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.15) 0%, transparent 50%);
    pointer-events: none;
    z-index: 1;
  }

  .halftone-overlay {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px);
    background-size: 16px 16px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 2;
  }

  .prompt-drop-container {
    width: 100%;
    max-width: 440px;
    min-height: 92vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 10;
    gap: 1rem;
  }

  /* Header Bar */
  .header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-bottom: 0.25rem;
  }

  .marquee-pill {
    background: #ffd700;
    color: #000000;
    border: 3px solid #000000;
    box-shadow: 4px 4px 0px #000000;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    font-family: 'Bungee', cursive;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transform: rotate(-1.5deg);
  }

  .round-pill {
    background: #240738;
    color: #00f2fe;
    border: 2px solid #00f2fe;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 900;
    letter-spacing: 0.04rem;
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
  }

  /* Decree Banner */
  .decree-banner {
    background: rgba(36, 7, 56, 0.85);
    border: 2px dashed #ff007f;
    border-radius: 0.85rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.82rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .decree-tag {
    color: #ff007f;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.05rem;
  }

  .decree-text {
    color: #ffe4e6;
    font-weight: 700;
    font-style: italic;
    line-height: 1.25;
  }

  /* Content Wrapper */
  .content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }

  /* Question Header */
  .question-header {
    text-align: center;
    margin-bottom: 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .aspect-badge {
    background: #ff007f;
    color: #ffffff;
    border: 2px solid #000000;
    box-shadow: 3px 3px 0px #000000;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 900;
    letter-spacing: 0.05rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .question-text {
    font-size: 1.35rem;
    font-weight: 900;
    color: #ffffff;
    margin: 0;
    line-height: 1.3;
    text-shadow: 2px 2px 0px #000000, 0 0 15px rgba(255, 215, 0, 0.4);
  }

  /* Quick Inspiration Chips */
  .inspiration-row {
    margin-bottom: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .inspiration-label {
    font-size: 0.7rem;
    font-weight: 800;
    color: #ffd700;
    letter-spacing: 0.05rem;
    padding-left: 0.25rem;
  }

  .chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .starter-chip {
    background: #240738;
    color: #caf0f8;
    border: 2px solid #00f2fe;
    border-radius: 999px;
    padding: 0.3rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
  }

  .starter-chip:active {
    transform: scale(0.95);
    background: #00f2fe;
    color: #000000;
  }

  .surprise-chip {
    border-color: #ffd700;
    color: #ffd700;
    background: rgba(255, 215, 0, 0.12);
  }

  .surprise-chip:active {
    background: #ffd700;
    color: #000000;
  }

  /* Idea Card Form */
  .idea-card-form {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
  }

  .idea-card-preview {
    background-color: var(--card-pastel-bg, #fef08a);
    color: #120320;
    border: 3.5px solid #000000;
    border-radius: 1.25rem;
    box-shadow: 6px 6px 0px #000000;
    padding: 0.85rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .idea-card-preview:focus-within {
    box-shadow: 6px 6px 0px #000000, 0 0 20px rgba(255, 215, 0, 0.5);
    transform: translateY(-2px);
  }

  .card-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.72rem;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.6);
    letter-spacing: 0.04rem;
    border-bottom: 1.5px dashed rgba(0, 0, 0, 0.2);
    padding-bottom: 0.25rem;
  }

  .card-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #120320;
    font-family: 'Fredoka', 'Outfit', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.35;
    resize: none;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }

  .card-textarea::placeholder {
    color: rgba(18, 3, 32, 0.45);
    font-weight: 600;
    font-size: 1.05rem;
  }

  .card-clear-btn {
    position: absolute;
    right: 0.65rem;
    bottom: 0.65rem;
    background: rgba(0, 0, 0, 0.15);
    color: #000000;
    border: none;
    border-radius: 50%;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 900;
    cursor: pointer;
  }

  /* Chute Guide Indicator */
  .drop-chute-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.68rem;
    font-weight: 900;
    color: #00f2fe;
    letter-spacing: 0.04rem;
    opacity: 0.85;
    animation: bounceDown 1.2s ease-in-out infinite alternate;
  }

  @keyframes bounceDown {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(3px);
    }
  }

  /* Juicy Submit Button */
  .btn-drop-submit {
    width: 100%;
    background: linear-gradient(135deg, #00ff88 0%, #00d26a 100%);
    color: #000000;
    border: 3.5px solid #000000;
    box-shadow: 6px 6px 0px #000000;
    border-radius: 1.15rem;
    padding: 1.1rem;
    font-family: 'Bungee', cursive;
    font-size: 1.15rem;
    letter-spacing: 0.04rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-drop-submit:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 3px 3px 0px #000000;
  }

  .btn-drop-submit:disabled {
    background: #334155;
    color: #64748b;
    border-color: #1e293b;
    box-shadow: 3px 3px 0px #0f172a;
    cursor: not-allowed;
  }

  /* PHASE 2: ANIMATED PHYSICAL DROP STAGE */
  .dropping-animation-stage {
    position: relative;
    width: 100%;
    height: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
  }

  .animated-dropping-card {
    position: absolute;
    width: 85%;
    max-width: 320px;
    background-color: var(--card-pastel-bg, #fef08a);
    color: #120320;
    border: 3.5px solid #000000;
    border-radius: 1.25rem;
    box-shadow: 6px 6px 0px #000000;
    padding: 1rem 1.25rem;
    animation: chuteDropAnim 0.65s cubic-bezier(0.55, 0, 1, 0.45) forwards;
    z-index: 20;
  }

  .card-dropped-text {
    font-size: 1.15rem;
    font-weight: 900;
    margin-top: 0.4rem;
    line-height: 1.3;
  }

  @keyframes chuteDropAnim {
    0% {
      top: 15%;
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
    20% {
      top: 10%;
      transform: scale(1.04) rotate(calc(var(--drop-rot) * -0.5));
    }
    100% {
      top: 130%;
      transform: scale(0.7) rotate(var(--drop-rot));
      opacity: 0.1;
    }
  }

  .trapdoor-tunnel {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    z-index: 10;
  }

  .trapdoor-left {
    width: 15%;
    height: 100%;
  }

  .trapdoor-right {
    width: 15%;
    height: 100%;
  }

  .trapdoor-light-beam {
    position: absolute;
    bottom: 0;
    width: 70%;
    height: 100px;
    background: radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.75) 0%, rgba(255, 0, 127, 0.3) 50%, transparent 80%);
    animation: trapdoorGlow 0.65s ease-out forwards;
  }

  @keyframes trapdoorGlow {
    0% { opacity: 0; transform: scaleY(0.2); }
    50% { opacity: 1; transform: scaleY(1); }
    100% { opacity: 0.6; transform: scaleY(0.8); }
  }

  .drop-particle {
    position: absolute;
    width: var(--p-size);
    height: var(--p-size);
    background-color: var(--p-color);
    border-radius: 3px;
    z-index: 30;
    animation: particleFlyAnim 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  @keyframes particleFlyAnim {
    0% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(var(--vx), var(--vy)) rotate(var(--p-rot));
      opacity: 0;
    }
  }

  /* PHASE 3: SUBMITTED CONFIRMATION & HOPPER PREVIEW */
  .submitted-hopper-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.15rem;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .confirmation-badge {
    background: #00ff88;
    color: #000000;
    border: 3.5px solid #000000;
    box-shadow: 5px 5px 0px #000000;
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    font-family: 'Bungee', cursive;
    font-size: 1.05rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transform: rotate(-1deg);
  }

  .mini-hopper-display {
    width: 100%;
    background: #240738;
    border: 3.5px solid #00f2fe;
    border-radius: 1.25rem;
    padding: 1rem;
    box-shadow: 0 8px 25px rgba(0, 242, 254, 0.25);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .hopper-funnel-top {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    font-weight: 900;
    color: #00f2fe;
    letter-spacing: 0.05rem;
  }

  .hopper-status-dot {
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    box-shadow: 0 0 8px #00ff88;
  }

  .hopper-landed-card {
    background-color: var(--card-pastel-bg, #fef08a);
    color: #120320;
    border: 3px solid #000000;
    border-radius: 0.95rem;
    box-shadow: 4px 4px 0px #000000;
    padding: 0.75rem 1rem;
    text-align: left;
    transform: rotate(1deg);
  }

  .landed-card-header {
    font-size: 0.68rem;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.5);
    letter-spacing: 0.04rem;
    margin-bottom: 0.2rem;
  }

  .landed-card-content {
    font-size: 1.05rem;
    font-weight: 900;
    line-height: 1.3;
  }

  .hopper-gears-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 0.68rem;
    font-weight: 800;
    color: #ffd700;
  }

  .gear-anim {
    display: inline-block;
    animation: spinGear 4s linear infinite;
  }

  @keyframes spinGear {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* TV Callout */
  .tv-callout-card {
    background: rgba(0, 0, 0, 0.55);
    border: 2px solid #ffd700;
    border-radius: 1.15rem;
    padding: 0.95rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-align: left;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.25);
  }

  .tv-radar-pulse {
    width: 2.75rem;
    height: 2.75rem;
    background: #ffd700;
    color: #000000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    flex-shrink: 0;
    border: 2.5px solid #000000;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.6);
    animation: tvPulse 1.4s ease-in-out infinite alternate;
  }

  @keyframes tvPulse {
    from { transform: scale(0.95); }
    to { transform: scale(1.06); }
  }

  .tv-callout-text h3 {
    margin: 0 0 0.15rem 0;
    font-size: 0.95rem;
    font-weight: 900;
    color: #ffd700;
    letter-spacing: 0.03rem;
  }

  .tv-callout-text p {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 600;
    color: #e2e8f0;
    line-height: 1.25;
  }

  /* Waiting Footer */
  .waiting-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .waiting-dots span {
    display: inline-block;
    animation: dotPulse 1.2s infinite ease-in-out;
  }
  .waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
  .waiting-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dotPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
</style>
