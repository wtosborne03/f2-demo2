<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  // Swipe Gestures & Lane Shift State
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let lastShiftDirection: 'up' | 'down' | null = null;
  let shiftIndicatorTimer: ReturnType<typeof setTimeout> | null = null;
  const SWIPE_THRESHOLD = 28;

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

  function moveLane(direction: number) {
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }

    lastShiftDirection = direction < 0 ? 'up' : 'down';
    if (shiftIndicatorTimer) clearTimeout(shiftIndicatorTimer);
    shiftIndicatorTimer = setTimeout(() => {
      lastShiftDirection = null;
    }, 450);
  }

  function handlePointerDown(e: PointerEvent) {
    if (triviaData) return;
    isDragging = true;
    startY = e.clientY;
    currentY = e.clientY;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || triviaData) return;
    currentY = e.clientY;
    const deltaY = currentY - startY;

    if (deltaY <= -SWIPE_THRESHOLD) {
      moveLane(-1); // Swipe UP
      startY = currentY;
    } else if (deltaY >= SWIPE_THRESHOLD) {
      moveLane(1); // Swipe DOWN
      startY = currentY;
    }
  }

  function handlePointerUp() {
    isDragging = false;
  }

  function handlePointerCancel() {
    isDragging = false;
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
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerCancel}
  class="w-full h-full min-h-screen bg-transparent text-base-content flex flex-col justify-between p-4 sm:p-6 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans"
>
  <!-- Header Bar -->
  <header class="flex items-center justify-between border-b border-base-content/10 pb-3 shrink-0">
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

  <!-- TRIVIA HAZARD MODE (No brown colors, clean DaisyUI native components) -->
  {#if triviaData}
    <div class="flex-1 flex flex-col justify-between py-4 relative">
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
        <!-- Question & ABCD Answers (Clean DaisyUI Buttons) -->
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
    <!-- REGULAR RACING STEERING: FULL-SCREEN SWIPE SURFACE WITH CLEAN HINT -->
    <div class="flex-1 flex flex-col items-center justify-center py-6 relative">
      {#if lastShiftDirection}
        <div class="badge badge-primary text-primary-content font-bold text-sm uppercase tracking-wider py-3.5 px-5 shadow-xl animate-bounce">
          {lastShiftDirection === 'up' ? '▲ SHIFT UP' : '▼ SHIFT DOWN'}
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 opacity-60">
          <svg class="w-10 h-10 text-base-content/70 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
          </svg>
          <span class="text-xs font-mono font-semibold uppercase tracking-widest text-base-content/70">
            SWIPE UP / DOWN TO CHANGE LANES
          </span>
        </div>
      {/if}
    </div>

    <!-- Minimal Clean Footer -->
    <footer class="text-center text-[10px] font-mono font-medium text-base-content/40 uppercase tracking-wider pt-2 border-t border-base-content/10">
      SWIPE TO AVOID OBSTACLES
    </footer>
  {/if}
</div>

<style>
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
