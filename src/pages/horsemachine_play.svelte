<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  // Swipe Gestures & Single-Lane Shift State
  let startY = 0;
  let currentY = 0;
  let dragOffsetY = 0;
  let isDragging = false;
  let hasSwipedInCurrentGesture = false;
  let lastSwipeTime = 0;

  const SWIPE_THRESHOLD = 32; // Pixels needed to register a swipe
  const SWIPE_COOLDOWN_MS = 200; // Tiny cooldown timeout between swipes

  // Visual Feedback State
  let activeFeedbackDir: 'up' | 'down' | null = null;
  let feedbackKey = 0;
  let feedbackTimer: any = null;

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

  function triggerSwipe(direction: -1 | 1) {
    // Send network event for single lane shift
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });

    // Provide haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch (e) {}
    }

    // Trigger visual feedback animation
    activeFeedbackDir = direction === -1 ? 'up' : 'down';
    feedbackKey += 1;

    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      activeFeedbackDir = null;
    }, 650);
  }

  function handlePointerDown(e: PointerEvent) {
    if (triviaData) return;
    isDragging = true;
    hasSwipedInCurrentGesture = false;
    startY = e.clientY;
    currentY = e.clientY;
    dragOffsetY = 0;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || triviaData) return;
    currentY = e.clientY;
    const rawDelta = currentY - startY;
    dragOffsetY = Math.max(-50, Math.min(50, rawDelta));

    // Only allow one lane change per continuous swipe gesture
    if (!hasSwipedInCurrentGesture) {
      const now = Date.now();
      if (rawDelta <= -SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        triggerSwipe(-1); // Swipe UP (Inner Lane)
      } else if (rawDelta >= SWIPE_THRESHOLD && now - lastSwipeTime >= SWIPE_COOLDOWN_MS) {
        hasSwipedInCurrentGesture = true;
        lastSwipeTime = now;
        triggerSwipe(1); // Swipe DOWN (Outer Lane)
      }
    }
  }

  function handlePointerUp() {
    isDragging = false;
    hasSwipedInCurrentGesture = false;
    dragOffsetY = 0;
  }

  function handlePointerCancel() {
    isDragging = false;
    hasSwipedInCurrentGesture = false;
    dragOffsetY = 0;
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
  data-no-emote
  on:pointerdown={handlePointerDown}
  on:pointermove={handlePointerMove}
  on:pointerup={handlePointerUp}
  on:pointercancel={handlePointerCancel}
  class="interactive w-full h-full min-h-screen bg-base-300 text-base-content flex flex-col justify-between p-4 sm:p-6 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans"
>
  <!-- Screen Edge Feedback Flash on Lane Shift -->
  {#if activeFeedbackDir === 'up'}
    {#key feedbackKey}
      <div class="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-primary/35 to-transparent pointer-events-none z-30 animate-edge-flash"></div>
    {/key}
  {:else if activeFeedbackDir === 'down'}
    {#key feedbackKey}
      <div class="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-primary/35 to-transparent pointer-events-none z-30 animate-edge-flash"></div>
    {/key}
  {/if}

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
    <!-- REGULAR RACING STEERING: INTERACTIVE SWIPE SURFACE WITH RICH VISUAL FEEDBACK -->
    <div class="flex-1 flex flex-col items-center justify-between py-4 relative z-10">
      
      <!-- Top Zone: Inner Lane Indicator -->
      <div class={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 border ${
        activeFeedbackDir === 'up'
          ? 'bg-primary/20 border-primary/50 text-primary scale-105 shadow-lg shadow-primary/20'
          : 'bg-base-200/40 border-base-content/5 text-base-content/50'
      }`}>
        <svg class={`w-5 h-5 transition-transform duration-200 ${activeFeedbackDir === 'up' ? '-translate-y-1' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
        <span class="text-xs font-mono font-bold uppercase tracking-widest">
          SWIPE UP • INNER LANE
        </span>
      </div>

      <!-- Center Steering Pad with Visual Swipe Response -->
      <div class="w-full relative flex flex-col items-center justify-center my-auto py-6">
        
        <!-- Animated Lane Shift Popup Notification -->
        {#if activeFeedbackDir}
          {#key feedbackKey}
            <div class="absolute -top-3 z-30 animate-badge-pop">
              <div class="badge badge-primary badge-lg py-3 px-4 font-mono font-bold tracking-wider shadow-xl flex items-center gap-2 text-xs">
                {#if activeFeedbackDir === 'up'}
                  <span>▲</span>
                  <span>SHIFTED INNER LANE</span>
                {:else}
                  <span>▼</span>
                  <span>SHIFTED OUTER LANE</span>
                {/if}
              </div>
            </div>
          {/key}
        {/if}

        <!-- Interactive Steering Visual Container -->
        <div class="w-52 h-64 rounded-3xl bg-base-200/60 border border-base-content/10 p-4 flex flex-col items-center justify-between relative shadow-inner overflow-hidden">
          
          <!-- Subtle Lane Background Lines -->
          <div class="absolute inset-x-6 inset-y-4 flex justify-between pointer-events-none opacity-20">
            <div class="w-0.5 h-full bg-base-content/40"></div>
            <div class="w-0.5 h-full bg-base-content/40"></div>
            <div class="w-0.5 h-full bg-base-content/40"></div>
            <div class="w-0.5 h-full bg-base-content/40"></div>
            <div class="w-0.5 h-full bg-base-content/40"></div>
          </div>

          <!-- Top Chevron Guide -->
          <div class={`transition-all duration-200 ${activeFeedbackDir === 'up' ? 'text-primary scale-125' : 'text-base-content/30'}`}>
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </div>

          <!-- Interactive Center Puck / Thumb Follower -->
          <div
            class={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-transform duration-75 relative z-10 border shadow-lg ${
              activeFeedbackDir
                ? 'bg-primary text-primary-content border-primary-content/30 scale-110 shadow-primary/40'
                : isDragging
                ? 'bg-primary/20 border-primary/40 text-primary scale-105'
                : 'bg-base-100/90 border-base-content/15 text-base-content'
            }`}
            style={`transform: translateY(${dragOffsetY}px);`}
          >
            {#if activeFeedbackDir === 'up'}
              <svg class="w-7 h-7 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            {:else if activeFeedbackDir === 'down'}
              <svg class="w-7 h-7 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            {:else}
              <svg class="w-6 h-6 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v18M7 7l5-4 5 4M7 17l5 4 5-4"/>
              </svg>
            {/if}
            <span class="text-[9px] font-mono font-bold tracking-tight mt-0.5 opacity-80 uppercase">
              {activeFeedbackDir ? 'LANE 1x' : 'SWIPE'}
            </span>
          </div>

          <!-- Bottom Chevron Guide -->
          <div class={`transition-all duration-200 ${activeFeedbackDir === 'down' ? 'text-primary scale-125' : 'text-base-content/30'}`}>
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </div>

        <!-- 1 Swipe = 1 Lane Tag -->
        <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-base-content/60 mt-4">
          1 SWIPE = 1 LANE CHANGE
        </span>
      </div>

      <!-- Bottom Zone: Outer Lane Indicator -->
      <div class={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300 border ${
        activeFeedbackDir === 'down'
          ? 'bg-primary/20 border-primary/50 text-primary scale-105 shadow-lg shadow-primary/20'
          : 'bg-base-200/40 border-base-content/5 text-base-content/50'
      }`}>
        <svg class={`w-5 h-5 transition-transform duration-200 ${activeFeedbackDir === 'down' ? 'translate-y-1' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
        <span class="text-xs font-mono font-bold uppercase tracking-widest">
          SWIPE DOWN • OUTER LANE
        </span>
      </div>
    </div>

    <!-- Minimal Clean Footer -->
    <footer class="text-center text-[10px] font-mono font-medium text-base-content/40 uppercase tracking-wider pt-2 border-t border-base-content/10 z-20">
      AVOID BANANAS & BOMBS • HIT THOUGHT BUBBLES
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

  @keyframes badgePop {
    0% {
      transform: scale(0.7) translateY(4px);
      opacity: 0;
    }
    50% {
      transform: scale(1.08) translateY(-2px);
      opacity: 1;
    }
    100% {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  @keyframes edgeFlash {
    0% {
      opacity: 0.9;
    }
    100% {
      opacity: 0;
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

  .animate-badge-pop {
    animation: badgePop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-edge-flash {
    animation: edgeFlash 0.5s ease-out forwards;
  }

  .animate-shake {
    animation: penaltyShake 0.4s ease-in-out;
  }
</style>
