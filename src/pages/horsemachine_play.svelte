<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  // Swipe Gestures & Single-Lane Shift State
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let hasSwipedInCurrentGesture = false;
  let lastSwipeTime = 0;
  let containerEl: HTMLDivElement;

  const SWIPE_THRESHOLD = 30; // Pixels needed to trigger a swipe
  const SWIPE_COOLDOWN_MS = 180; // Tiny cooldown timeout between swipes

  // Globby Material-style animation state
  interface ActiveGlob {
    id: number;
    x: number;
    y: number;
    direction: 'up' | 'down';
  }

  let activeGlobs: ActiveGlob[] = [];
  let nextGlobId = 0;

  // Trivia Hazard State (synced via page_data)
  $: triviaData = $gameState?.page_data?.trivia;
  let selectedTriviaAnswer: number | null = null;
  let lastTriviaQuestionId: string | null = null;
  let isAttentionEntering = false;
  let playedResultHaptic = false;

  $: if (triviaData && triviaData.questionId !== lastTriviaQuestionId) {
    lastTriviaQuestionId = triviaData.questionId;
    selectedTriviaAnswer = null;
    isAttentionEntering = true;
    playedResultHaptic = false;

    // Urgent attention-grabbing haptic pattern
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 60, 100, 60, 220]);
      } catch (e) {}
    }

    setTimeout(() => {
      isAttentionEntering = false;
    }, 1200);
  }

  // Trigger result haptics when result arrives
  $: if (triviaData?.result && !playedResultHaptic) {
    playedResultHaptic = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (triviaData.result === 'correct') {
          navigator.vibrate([60, 40, 120]);
        } else {
          navigator.vibrate([160, 80, 160]);
        }
      } catch (e) {}
    }
  }

  function triggerSwipe(direction: -1 | 1, touchX: number, touchY: number) {
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }

    const id = ++nextGlobId;
    const dir = direction === -1 ? 'up' : 'down';
    activeGlobs = [...activeGlobs, { id, x: touchX, y: touchY, direction: dir }];

    setTimeout(() => {
      activeGlobs = activeGlobs.filter((g) => g.id !== id);
    }, 600);
  }

  function handlePointerDown(e: PointerEvent) {
    if (triviaData) return;
    isDragging = true;
    hasSwipedInCurrentGesture = false;
    startY = e.clientY;
    currentY = e.clientY;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || triviaData) return;
    currentY = e.clientY;
    const rawDelta = currentY - startY;

    // Only allow one lane change per continuous swipe gesture
    if (!hasSwipedInCurrentGesture) {
      const now = Date.now();
      if (rawDelta <= -SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        const rect = containerEl?.getBoundingClientRect();
        const x = rect ? e.clientX - rect.left : e.clientX;
        const y = rect ? e.clientY - rect.top : e.clientY;
        triggerSwipe(-1, x, y);
      } else if (rawDelta >= SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        const rect = containerEl?.getBoundingClientRect();
        const x = rect ? e.clientX - rect.left : e.clientX;
        const y = rect ? e.clientY - rect.top : e.clientY;
        triggerSwipe(1, x, y);
      }
    }
  }

  function handlePointerUp() {
    isDragging = false;
    hasSwipedInCurrentGesture = false;
  }

  function handlePointerCancel() {
    isDragging = false;
    hasSwipedInCurrentGesture = false;
  }

  function submitTriviaAnswer(index: number) {
    if (selectedTriviaAnswer !== null) return;
    selectedTriviaAnswer = index;
    gameClient.sendInput({
      type: 'horse_trivia_answer',
      answer_index: index,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {}
    }
  }
</script>

<div
  bind:this={containerEl}
  data-no-emote
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerCancel}
  class="interactive w-full h-full min-h-screen bg-transparent text-base-content flex flex-col justify-between p-4 sm:p-6 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans"
>
  <!-- Material Globby CSS Animations Overlay -->
  {#each activeGlobs as glob (glob.id)}
    <div
      class="glob-anchor"
      style={`left: ${glob.x}px; top: ${glob.y}px;`}
    >
      <!-- Expanding Material Ripple -->
      <div class="material-ripple"></div>

      <!-- Globby Fluid Body with Directional Stretch -->
      <div class={`glob-body ${glob.direction === 'up' ? 'glob-stretch-up' : 'glob-stretch-down'}`}>
        <svg class="w-6 h-6 text-white/90 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          {#if glob.direction === 'up'}
            <path d="M18 15l-6-6-6 6" />
          {:else}
            <path d="M6 9l6 6 6-6" />
          {/if}
        </svg>
      </div>

      <!-- Fluid Droplets Floating in Direction of Swipe -->
      <div class={`glob-droplet-1 ${glob.direction === 'up' ? 'drop-up-1' : 'drop-down-1'}`}></div>
      <div class={`glob-droplet-2 ${glob.direction === 'up' ? 'drop-up-2' : 'drop-down-2'}`}></div>
    </div>
  {/each}

  <!-- Header Bar -->
  <header class="flex items-center justify-between border-b border-base-content/10 pb-3 shrink-0 z-20">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
      <span class="font-bold text-sm text-base-content tracking-wider font-mono">
        HORSE RACER
      </span>
    </div>
    <div class="badge badge-outline text-base-content/70 font-mono text-[11px] uppercase tracking-wider py-2 px-3">
      {triviaData ? 'TRIVIA' : 'STEERING'}
    </div>
  </header>

  <!-- TRIVIA HAZARD MODE -->
  {#if triviaData}
    <div class="flex-1 flex flex-col justify-between py-4 relative z-20">
      {#if isAttentionEntering}
        <div class="absolute -inset-2 rounded-3xl border-2 border-warning/60 bg-warning/10 animate-ping pointer-events-none z-50"></div>
      {/if}

      {#if triviaData.result}
        <!-- Result Screen -->
        <div
          class={`card flex-1 flex flex-col items-center justify-center p-6 border shadow-2xl text-center my-auto transition-all animate-result-pop z-20 ${
            triviaData.result === 'correct'
              ? 'bg-success/15 border-success/40 text-success-content shadow-success/20'
              : 'bg-error/15 border-error/40 text-error-content shadow-error/20'
          }`}
        >
          {#if triviaData.result === 'correct'}
            <div class="w-16 h-16 rounded-2xl bg-success/20 border-2 border-success flex items-center justify-center mb-3 text-3xl font-black text-success">
              ✔
            </div>
            <div class="badge badge-success badge-sm font-mono font-bold uppercase tracking-wider mb-2">
              SPEED SURGE
            </div>
            <h2 class="text-2xl font-bold tracking-wide">
              CORRECT!
            </h2>
            <div class="mt-4 p-3 bg-base-100/50 rounded-xl border border-success/30 w-full text-center">
              <p class="text-xs sm:text-sm font-bold text-success">
                +20M SURGE BOOST ACTIVATED
              </p>
            </div>
          {:else}
            <div class="w-16 h-16 rounded-2xl bg-error/20 border-2 border-error flex items-center justify-center mb-3 text-3xl font-black text-error animate-shake">
              ✖
            </div>
            <div class="badge badge-error badge-sm font-mono font-bold uppercase tracking-wider mb-2">
              PENALTY SETBACK
            </div>
            <h2 class="text-2xl font-bold tracking-wide">
              WRONG ANSWER!
            </h2>
            {#if triviaData.correctOption}
              <div class="mt-4 p-3 bg-base-100/50 rounded-xl border border-error/30 w-full text-left">
                <span class="text-[10px] font-mono font-bold text-error uppercase tracking-wider block mb-1">
                  CORRECT ANSWER:
                </span>
                <p class="text-xs sm:text-sm font-semibold">
                  {triviaData.correctOption}
                </p>
              </div>
            {/if}
          {/if}
          <span class="mt-6 text-[11px] font-mono font-bold text-base-content/50 tracking-widest uppercase animate-pulse">
            RESUMING CONTROLS...
          </span>
        </div>
      {:else}
        <!-- Question & ABCD Answers -->
        <div class="card bg-base-200/60 border border-base-content/10 p-4 text-center shadow-lg">
          <span class="text-[10px] font-mono font-bold text-warning uppercase tracking-widest block mb-1">
            HORSE TRIVIA
          </span>
          <h3 class="text-base sm:text-lg font-bold text-base-content leading-snug">
            "{triviaData.question}"
          </h3>
        </div>

        <div class="grid grid-cols-1 gap-2.5 my-auto">
          {#each triviaData.options as option, idx}
            {@const optionLetters = ['A', 'B', 'C', 'D']}
            {@const isSelected = selectedTriviaAnswer === idx}
            <button
              type="button"
              on:click={() => submitTriviaAnswer(idx)}
              disabled={selectedTriviaAnswer !== null}
              class={`btn btn-block h-auto py-3.5 px-4 rounded-xl border text-sm text-left flex items-center justify-between transition-all ${
                isSelected
                  ? 'btn-primary shadow-lg scale-[1.01]'
                  : selectedTriviaAnswer !== null
                  ? 'btn-neutral opacity-40'
                  : 'btn-outline border-base-content/20 hover:bg-base-200 active:scale-[0.98]'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class={`badge ${isSelected ? 'badge-primary-content text-primary font-bold' : 'badge-ghost'} font-mono text-xs`}>
                  {optionLetters[idx]}
                </span>
                <span class="leading-tight">{option}</span>
              </div>
              {#if isSelected}
                <span class="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
                  LOCKED ✔
                </span>
              {/if}
            </button>
          {/each}
        </div>

        <div class="text-center text-[10px] font-mono font-bold text-base-content/50 uppercase tracking-widest">
          {selectedTriviaAnswer !== null ? 'ANSWER LOCKED IN • WATCH TV' : 'TAP AN OPTION BEFORE TIME EXPIRES'}
        </div>
      {/if}
    </div>
  {:else}
    <!-- REGULAR RACING STEERING: FULL-SCREEN CLEAN GESTURE CANVAS -->
    <div class="flex-1 flex flex-col items-center justify-center py-6 relative z-10">
      <div class="flex flex-col items-center gap-3 opacity-60 pointer-events-none select-none">
        <div class="w-12 h-12 rounded-full border border-base-content/20 flex items-center justify-center animate-pulse">
          <svg class="w-6 h-6 text-base-content/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
          </svg>
        </div>
        <span class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/70">
          SWIPE UP / DOWN TO CHANGE LANES
        </span>
      </div>
    </div>

    <!-- Minimal Clean Footer -->
    <footer class="text-center text-[10px] font-mono font-medium text-base-content/40 uppercase tracking-wider pt-2 border-t border-base-content/10 z-20 pointer-events-none">
      AVOID BANANAS & BOMBS • HIT THOUGHT BUBBLES
    </footer>
  {/if}
</div>

<style>
  /* Globby & Material Ripple Animations */
  .glob-anchor {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Material Expanding Ink Ripple */
  .material-ripple {
    position: absolute;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%);
    animation: rippleExpand 0.55s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
  }

  /* Globby Fluid Body with Organic Morphing */
  .glob-body {
    position: absolute;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
    box-shadow: 0 8px 24px -4px rgba(56, 189, 248, 0.6), inset 0 2px 6px rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 48% 52% 58% 42% / 54% 46% 54% 46%;
    backdrop-filter: blur(8px);
  }

  .glob-stretch-up {
    animation: globMotionUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .glob-stretch-down {
    animation: globMotionDown 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  /* Small trailing droplets */
  .glob-droplet-1, .glob-droplet-2 {
    position: absolute;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 2px 8px rgba(56, 189, 248, 0.5);
    opacity: 0;
  }

  .glob-droplet-1 {
    width: 14px;
    height: 14px;
  }

  .glob-droplet-2 {
    width: 8px;
    height: 8px;
  }

  .drop-up-1 {
    animation: dropUp1 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  .drop-up-2 {
    animation: dropUp2 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  .drop-down-1 {
    animation: dropDown1 0.45s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  .drop-down-2 {
    animation: dropDown2 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  }

  /* Keyframe Definitions */
  @keyframes rippleExpand {
    0% {
      transform: scale(0.4);
      opacity: 0.85;
    }
    100% {
      transform: scale(3.2);
      opacity: 0;
    }
  }

  @keyframes globMotionUp {
    0% {
      transform: translateY(0) scale(0.6, 0.6);
      border-radius: 50%;
      opacity: 0.95;
    }
    30% {
      transform: translateY(-24px) scale(0.72, 1.45);
      border-radius: 40% 40% 60% 60% / 35% 35% 65% 65%;
      opacity: 0.9;
    }
    70% {
      transform: translateY(-56px) scale(0.9, 1.15);
      border-radius: 48% 52% 52% 48% / 46% 46% 54% 54%;
      opacity: 0.7;
    }
    100% {
      transform: translateY(-80px) scale(1.15, 0.7);
      border-radius: 50%;
      opacity: 0;
    }
  }

  @keyframes globMotionDown {
    0% {
      transform: translateY(0) scale(0.6, 0.6);
      border-radius: 50%;
      opacity: 0.95;
    }
    30% {
      transform: translateY(24px) scale(0.72, 1.45);
      border-radius: 60% 60% 40% 40% / 65% 65% 35% 35%;
      opacity: 0.9;
    }
    70% {
      transform: translateY(56px) scale(0.9, 1.15);
      border-radius: 48% 52% 52% 48% / 54% 54% 46% 46%;
      opacity: 0.7;
    }
    100% {
      transform: translateY(80px) scale(1.15, 0.7);
      border-radius: 50%;
      opacity: 0;
    }
  }

  @keyframes dropUp1 {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-90px) scale(0.2);
      opacity: 0;
    }
  }

  @keyframes dropUp2 {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-110px) translateX(12px) scale(0.1);
      opacity: 0;
    }
  }

  @keyframes dropDown1 {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: translateY(90px) scale(0.2);
      opacity: 0;
    }
  }

  @keyframes dropDown2 {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: translateY(110px) translateX(-12px) scale(0.1);
      opacity: 0;
    }
  }

  @keyframes resultPop {
    0% {
      transform: scale(0.88);
      opacity: 0;
    }
    60% {
      transform: scale(1.03);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes penaltyShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  .animate-result-pop {
    animation: resultPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-shake {
    animation: penaltyShake 0.4s ease-in-out;
  }
</style>
