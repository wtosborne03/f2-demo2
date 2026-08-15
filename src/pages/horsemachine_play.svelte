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

  const SWIPE_THRESHOLD = 26; // Pixels needed to trigger a swipe
  const SWIPE_COOLDOWN_MS = 140; // Cooldown between distinct swipes

  // Background Ripple Effect on Swipe / Touch
  interface TouchRipple {
    id: number;
    x: number;
    y: number;
    direction: 'up' | 'down' | 'tap';
  }

  let ripples: TouchRipple[] = [];
  let nextRippleId = 0;

  // Trivia Hazard State (synced via page_data)
  $: rawPageData = $gameState?.page_data;
  $: triviaData = rawPageData?.trivia || (rawPageData?.question ? rawPageData : null);
  $: questionOptions = triviaData?.options || triviaData?.answers || [];

  let selectedTriviaAnswer: number | null = null;
  let lastTriviaQuestionKey: string | null = null;
  let playedResultHaptic = false;

  let timerInterval: any = null;
  let remainingTime = 10;
  let totalDuration = 10;

  $: currentQuestionKey = triviaData ? (triviaData.questionId || triviaData.question || 'trivia') : null;

  $: if (triviaData && currentQuestionKey !== lastTriviaQuestionKey) {
    lastTriviaQuestionKey = currentQuestionKey;
    selectedTriviaAnswer = null;
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

    // Subtle attention haptic
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch (e) {}
    }
  }

  $: if (!triviaData || triviaData.result) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Result haptics
  $: if (triviaData?.result && !playedResultHaptic) {
    playedResultHaptic = true;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (triviaData.result === 'correct') {
          navigator.vibrate([50, 40, 100]);
        } else {
          navigator.vibrate([120, 60, 120]);
        }
      } catch (e) {}
    }
  }

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function addRipple(x: number, y: number, direction: 'up' | 'down' | 'tap') {
    const id = ++nextRippleId;
    ripples = [...ripples, { id, x, y, direction }];
    setTimeout(() => {
      ripples = ripples.filter((r) => r.id !== id);
    }, 600);
  }

  function triggerSwipe(direction: -1 | 1, touchX: number, touchY: number) {
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(20);
      } catch (e) {}
    }

    addRipple(touchX, touchY, direction === -1 ? 'up' : 'down');
  }

  function handlePointerDown(e: PointerEvent) {
    isDragging = true;
    hasSwipedInCurrentGesture = false;
    startY = e.clientY;
    currentY = e.clientY;

    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : e.clientX;
    const y = rect ? e.clientY - rect.top : e.clientY;
    addRipple(x, y, 'tap');
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    currentY = e.clientY;
    const rawDelta = currentY - startY;

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
        navigator.vibrate(35);
      } catch (e) {}
    }
  }
</script>

<div
  bind:this={containerEl}
  data-no-emote
  class="w-full h-[100dvh] h-screen bg-transparent text-base-content flex flex-col justify-between p-3 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans"
>
  <!-- Header Bar -->
  <header class="flex items-center justify-between border-b border-base-content/10 pb-2 shrink-0 z-30">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
      <span class="font-bold text-sm tracking-wider font-mono">
        DERBY RACER
      </span>
    </div>
    {#if triviaData}
      <div class="badge badge-warning font-mono text-[11px] font-bold py-1.5 px-2.5 animate-pulse">
        TRIVIA
      </div>
    {/if}
  </header>

  <!-- MAIN INTERACTIVE CONTAINER WITH BACKGROUND RIPPLES -->
  {#if triviaData}
    <!-- DUAL VIEW: TOP TRIVIA + BOTTOM SWIPE -->
    <div class="flex-1 flex flex-col justify-between min-h-0 py-2 relative z-20 gap-2">
      <!-- TOP TRIVIA CARD -->
      <div class="h-[52%] max-h-[52%] min-h-[200px] flex flex-col justify-between p-3 rounded-2xl bg-base-200/90 border border-warning/40 shadow-xl backdrop-blur-md relative overflow-hidden">
        {#if triviaData.result}
          <!-- Result Feedback -->
          <div
            class={`card flex-1 flex flex-col items-center justify-center p-3 text-center my-auto transition-all ${
              triviaData.result === 'correct'
                ? 'bg-success/20 border border-success/40 text-success-content'
                : 'bg-error/20 border border-error/40 text-error-content'
            }`}
          >
            {#if triviaData.result === 'correct'}
              <div class="text-3xl font-black text-success mb-1">✔</div>
              <h2 class="text-lg font-black tracking-wide">
                BOOST! +20M
              </h2>
            {:else}
              <div class="text-3xl font-black text-error mb-1">✖</div>
              <h2 class="text-lg font-black tracking-wide">
                WRONG!
              </h2>
              {#if triviaData.correctOption}
                <div class="mt-1 px-2 py-0.5 bg-base-100/70 rounded-lg text-xs font-mono font-bold text-error">
                  {triviaData.correctOption}
                </div>
              {/if}
            {/if}
          </div>
        {:else}
          <!-- Question Header & Timer -->
          <div class="shrink-0 mb-1">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[11px] font-mono font-bold text-warning uppercase">
                TRIVIA QUESTION
              </span>
              <span class="badge badge-warning badge-sm font-mono font-black text-[11px] px-2 py-0.5">
                {Math.ceil(remainingTime)}s
              </span>
            </div>

            <!-- Timer Bar -->
            <div class="w-full bg-base-300 h-1.5 rounded-full overflow-hidden">
              <div
                class="bg-gradient-to-r from-warning to-error h-full transition-all duration-100 ease-linear"
                style={`width: ${Math.max(0, Math.min(100, (remainingTime / totalDuration) * 100))}%`}
              ></div>
            </div>
          </div>

          <!-- Question Prompt -->
          <div class="bg-base-300/80 rounded-xl p-2.5 text-center shrink-0 shadow-inner">
            <h3 class="text-xs sm:text-sm font-bold leading-snug line-clamp-2">
              "{triviaData.question}"
            </h3>
          </div>

          <!-- 2x2 Option Buttons -->
          <div class="grid grid-cols-2 gap-2 my-auto pt-1">
            {#each questionOptions as option, idx}
              {@const optionLetters = ['A', 'B', 'C', 'D']}
              {@const isSelected = selectedTriviaAnswer === idx}
              <button
                type="button"
                on:click={() => submitTriviaAnswer(idx)}
                disabled={selectedTriviaAnswer !== null}
                class={`btn btn-sm sm:btn-md h-auto min-h-[38px] py-1.5 px-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all select-none ${
                  isSelected
                    ? 'btn-primary shadow-lg scale-[1.02]'
                    : selectedTriviaAnswer !== null
                    ? 'btn-neutral opacity-35'
                    : 'btn-outline border-base-content/20 bg-base-100/50 hover:bg-base-200 active:scale-[0.97]'
                }`}
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <span class={`badge badge-xs font-mono font-bold ${isSelected ? 'badge-primary-content text-primary' : 'badge-ghost'}`}>
                    {optionLetters[idx]}
                  </span>
                  <span class="leading-tight truncate text-[11px] sm:text-xs font-medium">{option}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- BOTTOM SWIPE STEERING ZONE WITH BACKGROUND RIPPLES -->
      <div
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointercancel={handlePointerCancel}
        class="h-[44%] flex-1 relative flex flex-col items-center justify-center rounded-2xl bg-base-200/40 border border-primary/25 p-3 touch-none select-none overflow-hidden cursor-ns-resize"
      >
        <!-- Background Ripples -->
        {#each ripples as ripple (ripple.id)}
          <div
            class="touch-ripple"
            style={`left: ${ripple.x}px; top: ${ripple.y}px;`}
          ></div>
        {/each}

        <!-- Center Indicator -->
        <div class="flex items-center gap-2 pointer-events-none select-none opacity-60">
          <span class="text-sm font-bold text-primary">▲</span>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-base-content/80">
            SWIPE TO STEER
          </span>
          <span class="text-sm font-bold text-primary">▼</span>
        </div>
      </div>
    </div>
  {:else}
    <!-- FULL-SCREEN CLEAN SWIPE CANVAS WITH BACKGROUND RIPPLES -->
    <div
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointercancel={handlePointerCancel}
      class="flex-1 relative flex flex-col items-center justify-center my-2 rounded-3xl bg-base-200/30 border border-base-content/10 touch-none select-none overflow-hidden cursor-ns-resize shadow-inner active:border-primary/40 transition-colors z-10"
    >
      <!-- Background Ripples -->
      {#each ripples as ripple (ripple.id)}
        <div
          class="touch-ripple"
          style={`left: ${ripple.x}px; top: ${ripple.y}px;`}
        ></div>
      {/each}

      <!-- Center Minimal Prompt -->
      <div class="flex flex-col items-center gap-2 opacity-60 pointer-events-none select-none">
        <div class="w-12 h-12 rounded-full border border-base-content/20 flex items-center justify-center bg-base-100/40 shadow-sm">
          <svg class="w-6 h-6 text-base-content/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
          </svg>
        </div>
        <span class="text-xs font-mono font-bold uppercase tracking-widest text-base-content/70">
          SWIPE TO STEER
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Clean Background Ripple Animation */
  .touch-ripple {
    position: absolute;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 75%);
    animation: rippleExpand 0.55s ease-out forwards;
  }

  @keyframes rippleExpand {
    0% {
      width: 0px;
      height: 0px;
      opacity: 0.85;
    }
    100% {
      width: 320px;
      height: 320px;
      opacity: 0;
    }
  }
</style>
