<script lang="ts">
  import { onDestroy } from 'svelte';
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  // Swipe Gestures & Single-Lane Shift State
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let hasSwipedInCurrentGesture = false;
  let lastSwipeTime = 0;
  let containerEl: HTMLDivElement;
  let swipeZoneEl: HTMLDivElement;

  const SWIPE_THRESHOLD = 28; // Pixels needed to trigger a swipe
  const SWIPE_COOLDOWN_MS = 160; // Tiny cooldown timeout between swipes

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

  let timerInterval: any = null;
  let remainingTime = 10;
  let totalDuration = 10;

  $: if (triviaData && triviaData.questionId !== lastTriviaQuestionId) {
    lastTriviaQuestionId = triviaData.questionId;
    selectedTriviaAnswer = null;
    isAttentionEntering = true;
    playedResultHaptic = false;
    totalDuration = triviaData.duration || 10;
    remainingTime = totalDuration;

    if (timerInterval) clearInterval(timerInterval);
    const startTime = Date.now();
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      remainingTime = Math.max(0, totalDuration - elapsed);
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
      }
    }, 100);

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

  $: if (!triviaData || triviaData.result) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
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

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

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
    isDragging = true;
    hasSwipedInCurrentGesture = false;
    startY = e.clientY;
    currentY = e.clientY;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    currentY = e.clientY;
    const rawDelta = currentY - startY;

    // Only allow one lane change per continuous swipe gesture
    if (!hasSwipedInCurrentGesture) {
      const now = Date.now();
      if (rawDelta <= -SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
        const x = rect ? e.clientX - rect.left : e.clientX;
        const y = rect ? e.clientY - rect.top : e.clientY;
        triggerSwipe(-1, x, y);
      } else if (rawDelta >= SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
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
  class="interactive w-full h-[100dvh] h-screen bg-transparent text-base-content flex flex-col justify-between p-3 sm:p-4 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans"
>
  <!-- Header Bar -->
  <header class="flex items-center justify-between border-b border-base-content/10 pb-2.5 shrink-0 z-30">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
      <span class="font-bold text-sm text-base-content tracking-wider font-mono">
        DERBY RACER
      </span>
    </div>
    <div class={`badge font-mono text-[11px] uppercase tracking-wider py-2 px-3 transition-colors ${
      triviaData ? 'badge-warning text-warning-content font-bold shadow-md animate-pulse' : 'badge-outline text-base-content/70'
    }`}>
      {triviaData ? 'TRIVIA • DUAL CONTROLS' : 'STEERING ACTIVE'}
    </div>
  </header>

  <!-- TRIVIA ACTIVE: DUAL-SPLIT VIEW (TOP HALF TRIVIA + BOTTOM HALF SWIPE STEERING) -->
  {#if triviaData}
    <div class="flex-1 flex flex-col justify-between min-h-0 py-2 relative z-20 gap-2">
      <!-- TOP HALF: TRIVIA SPRINT HAZARD CONTAINER -->
      <div class="h-[52%] max-h-[52%] min-h-[220px] flex flex-col justify-between p-3 rounded-2xl bg-base-200/70 border border-warning/30 shadow-xl backdrop-blur-md relative overflow-hidden">
        {#if isAttentionEntering}
          <div class="absolute -inset-2 rounded-3xl border-2 border-warning/70 bg-warning/15 animate-ping pointer-events-none z-50"></div>
        {/if}

        {#if triviaData.result}
          <!-- Result Card -->
          <div
            class={`card flex-1 flex flex-col items-center justify-center p-3 text-center my-auto transition-all animate-result-pop z-20 ${
              triviaData.result === 'correct'
                ? 'bg-success/20 border border-success/40 text-success-content'
                : 'bg-error/20 border border-error/40 text-error-content'
            }`}
          >
            {#if triviaData.result === 'correct'}
              <div class="w-12 h-12 rounded-xl bg-success/25 border-2 border-success flex items-center justify-center mb-1.5 text-2xl font-black text-success">
                ✔
              </div>
              <div class="badge badge-success badge-sm font-mono font-bold uppercase tracking-wider mb-1">
                SPEED SURGE ACTIVATED
              </div>
              <h2 class="text-xl font-bold tracking-wide">
                CORRECT! +20M BOOST
              </h2>
            {:else}
              <div class="w-12 h-12 rounded-xl bg-error/25 border-2 border-error flex items-center justify-center mb-1.5 text-2xl font-black text-error animate-shake">
                ✖
              </div>
              <div class="badge badge-error badge-sm font-mono font-bold uppercase tracking-wider mb-1">
                PENALTY SETBACK
              </div>
              <h2 class="text-xl font-bold tracking-wide">
                WRONG ANSWER!
              </h2>
              {#if triviaData.correctOption}
                <div class="mt-1.5 px-2.5 py-1 bg-base-100/60 rounded-lg border border-error/30 w-full text-center">
                  <span class="text-[10px] font-mono font-bold text-error uppercase tracking-wider">
                    CORRECT: {triviaData.correctOption}
                  </span>
                </div>
              {/if}
            {/if}
            <span class="mt-2 text-[10px] font-mono font-bold text-base-content/60 tracking-widest uppercase animate-pulse">
              STEERING ACTIVE BELOW
            </span>
          </div>
        {:else}
          <!-- Question Header & Countdown -->
          <div class="shrink-0 mb-1.5">
            <div class="flex items-center justify-between gap-2 mb-1">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-warning animate-ping"></span>
                <span class="text-[10px] font-mono font-black text-warning uppercase tracking-widest">
                  TRIVIA SPRINT
                </span>
              </div>
              <div class="badge badge-warning badge-sm font-mono font-black text-[10px] px-2 py-0.5">
                {Math.ceil(remainingTime)}s
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden border border-base-content/10">
              <div
                class="bg-gradient-to-r from-warning to-error h-full transition-all duration-100 ease-linear"
                style={`width: ${Math.max(0, Math.min(100, (remainingTime / totalDuration) * 100))}%`}
              ></div>
            </div>
          </div>

          <!-- Question Text -->
          <div class="bg-base-300/60 rounded-xl p-2.5 text-center border border-base-content/10 shrink-0 shadow-inner">
            <h3 class="text-xs sm:text-sm font-bold text-base-content leading-snug line-clamp-2">
              "{triviaData.question}"
            </h3>
          </div>

          <!-- 2x2 Option Buttons -->
          <div class="grid grid-cols-2 gap-2 my-auto pt-1">
            {#each triviaData.options as option, idx}
              {@const optionLetters = ['A', 'B', 'C', 'D']}
              {@const isSelected = selectedTriviaAnswer === idx}
              <button
                type="button"
                on:click={() => submitTriviaAnswer(idx)}
                disabled={selectedTriviaAnswer !== null}
                class={`btn btn-sm sm:btn-md h-auto min-h-[38px] sm:min-h-[42px] py-1.5 px-2.5 rounded-xl border text-xs sm:text-sm text-left flex items-center justify-between transition-all select-none ${
                  isSelected
                    ? 'btn-primary shadow-lg scale-[1.02] border-primary-focus'
                    : selectedTriviaAnswer !== null
                    ? 'btn-neutral opacity-35'
                    : 'btn-outline border-base-content/25 bg-base-100/40 hover:bg-base-200 active:scale-[0.97]'
                }`}
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <span class={`badge badge-xs font-mono font-bold px-1.5 py-0.5 ${isSelected ? 'badge-primary-content text-primary' : 'badge-ghost'}`}>
                    {optionLetters[idx]}
                  </span>
                  <span class="leading-tight truncate text-[11px] sm:text-xs font-semibold">{option}</span>
                </div>
                {#if isSelected}
                  <span class="text-[9px] font-mono font-black uppercase tracking-wider bg-black/25 px-1.5 py-0.5 rounded text-white ml-1 shrink-0">
                    LOCKED ✔
                  </span>
                {/if}
              </button>
            {/each}
          </div>

          <div class="text-center text-[9px] font-mono font-bold text-base-content/50 uppercase tracking-widest shrink-0 mt-0.5">
            {selectedTriviaAnswer !== null ? 'ANSWER LOCKED IN • SWIPE BELOW TO STEER' : 'TAP OPTION • SWIPE BELOW TO CHANGE LANES'}
          </div>
        {/if}
      </div>

      <!-- SPLIT SEPARATOR BAR -->
      <div class="shrink-0 flex items-center gap-2 py-0.5 select-none pointer-events-none">
        <div class="h-[1px] bg-base-content/15 flex-1"></div>
        <span class="text-[9px] font-mono font-black uppercase tracking-widest text-primary px-2.5 py-0.5 bg-primary/10 rounded-full border border-primary/25 shadow-sm flex items-center gap-1.5">
          <span>▲</span> SWIPE TO STEER <span>▼</span>
        </span>
        <div class="h-[1px] bg-base-content/15 flex-1"></div>
      </div>

      <!-- BOTTOM HALF: DEDICATED SWIPE STEERING ZONE -->
      <div
        bind:this={swipeZoneEl}
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointercancel={handlePointerCancel}
        class="h-[42%] flex-1 relative flex flex-col items-center justify-center rounded-2xl bg-base-200/50 border-2 border-dashed border-primary/30 p-3 touch-none select-none overflow-hidden cursor-ns-resize shadow-inner active:border-primary/60 transition-colors"
      >
        <!-- Material Globby CSS Animations Overlay inside Swipe Zone -->
        {#each activeGlobs as glob (glob.id)}
          <div
            class="glob-anchor"
            style={`left: ${glob.x}px; top: ${glob.y}px;`}
          >
            <div class="material-ripple"></div>
            <div class={`glob-body ${glob.direction === 'up' ? 'glob-stretch-up' : 'glob-stretch-down'}`}>
              <svg class="w-6 h-6 text-white/90 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                {#if glob.direction === 'up'}
                  <path d="M18 15l-6-6-6 6" />
                {:else}
                  <path d="M6 9l6 6 6-6" />
                {/if}
              </svg>
            </div>
            <div class={`glob-droplet-1 ${glob.direction === 'up' ? 'drop-up-1' : 'drop-down-1'}`}></div>
            <div class={`glob-droplet-2 ${glob.direction === 'up' ? 'drop-up-2' : 'drop-down-2'}`}></div>
          </div>
        {/each}

        <!-- Interactive Visual Cue -->
        <div class="flex flex-col items-center gap-2 pointer-events-none select-none opacity-85">
          <div class="w-11 h-11 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center shadow-md animate-pulse">
            <svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
            </svg>
          </div>
          <span class="text-xs font-mono font-bold uppercase tracking-widest text-base-content/90">
            SWIPE UP / DOWN TO STEER
          </span>
          <span class="text-[10px] font-mono text-base-content/50 uppercase tracking-wider">
            LANE CONTROLS ACTIVE DURING TRIVIA
          </span>
        </div>
      </div>
    </div>
  {:else}
    <!-- FULL-SCREEN REGULAR STEERING CANVAS -->
    <div
      bind:this={swipeZoneEl}
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointercancel={handlePointerCancel}
      class="flex-1 relative flex flex-col items-center justify-center my-3 rounded-3xl bg-base-200/30 border border-base-content/10 touch-none select-none overflow-hidden cursor-ns-resize shadow-inner active:border-primary/40 transition-colors z-10"
    >
      <!-- Material Globby CSS Animations Overlay -->
      {#each activeGlobs as glob (glob.id)}
        <div
          class="glob-anchor"
          style={`left: ${glob.x}px; top: ${glob.y}px;`}
        >
          <div class="material-ripple"></div>
          <div class={`glob-body ${glob.direction === 'up' ? 'glob-stretch-up' : 'glob-stretch-down'}`}>
            <svg class="w-6 h-6 text-white/90 drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
              {#if glob.direction === 'up'}
                <path d="M18 15l-6-6-6 6" />
              {:else}
                <path d="M6 9l6 6 6-6" />
              {/if}
            </svg>
          </div>
          <div class={`glob-droplet-1 ${glob.direction === 'up' ? 'drop-up-1' : 'drop-down-1'}`}></div>
          <div class={`glob-droplet-2 ${glob.direction === 'up' ? 'drop-up-2' : 'drop-down-2'}`}></div>
        </div>
      {/each}

      <div class="flex flex-col items-center gap-3 opacity-70 pointer-events-none select-none">
        <div class="w-14 h-14 rounded-full border-2 border-base-content/20 flex items-center justify-center animate-pulse bg-base-100/50 shadow-md">
          <svg class="w-7 h-7 text-base-content/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
          </svg>
        </div>
        <span class="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-base-content/80">
          SWIPE UP / DOWN TO CHANGE LANES
        </span>
        <span class="text-[10px] font-mono text-base-content/50 uppercase tracking-wider">
          Single lane shift per swipe
        </span>
      </div>
    </div>

    <!-- Minimal Clean Footer -->
    <footer class="text-center text-[10px] font-mono font-medium text-base-content/40 uppercase tracking-wider pt-2 border-t border-base-content/10 z-20 pointer-events-none shrink-0">
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
