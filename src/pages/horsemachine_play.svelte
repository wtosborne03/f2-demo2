<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  let whipCooldown = false;
  let steroidCooldown = false;

  // Swipe & Touch Gestures State
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  let dragOffsetY = 0; // clamped visual offset (-55px to 55px)
  let lastShiftDirection: 'up' | 'down' | null = null;
  let shiftIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

  const SWIPE_THRESHOLD = 32; // px needed to trigger lane shift
  const MAX_DRAG_OFFSET = 55; // px max visual travel of thumb pad

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

  function moveLane(direction: number) {
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });

    // Tactile haptic feedback on supported mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }

    // Visual feedback highlight
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
    dragOffsetY = 0;

    // Capture pointer if available
    const target = e.currentTarget as HTMLElement | null;
    if (target?.setPointerCapture) {
      try {
        target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging || triviaData) return;

    currentY = e.clientY;
    const rawDelta = currentY - startY;

    // Elastic clamped drag visual offset
    dragOffsetY = Math.max(-MAX_DRAG_OFFSET, Math.min(MAX_DRAG_OFFSET, rawDelta * 0.7));

    // Check if swipe threshold is crossed
    if (rawDelta <= -SWIPE_THRESHOLD) {
      moveLane(-1); // Swipe UP -> Lane Shift UP / Inner Rail
      startY = currentY; // Reset anchor for smooth continuous dragging
      dragOffsetY = -MAX_DRAG_OFFSET * 0.5;
    } else if (rawDelta >= SWIPE_THRESHOLD) {
      moveLane(1); // Swipe DOWN -> Lane Shift DOWN / Outer Rail
      startY = currentY; // Reset anchor for smooth continuous dragging
      dragOffsetY = MAX_DRAG_OFFSET * 0.5;
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    dragOffsetY = 0;

    const target = e.currentTarget as HTMLElement | null;
    if (target?.releasePointerCapture) {
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  }

  function handlePointerCancel() {
    isDragging = false;
    dragOffsetY = 0;
  }

  function triggerWhip() {
    if (whipCooldown || triviaData) return;
    whipCooldown = true;
    gameClient.sendInput({
      type: 'whip',
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch (e) {}
    }
    setTimeout(() => {
      whipCooldown = false;
    }, 1500);
  }

  function triggerSteroid() {
    if (steroidCooldown || triviaData) return;
    steroidCooldown = true;
    gameClient.sendInput({
      type: 'steroid',
    });
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 50, 60]);
      } catch (e) {}
    }
    setTimeout(() => {
      steroidCooldown = false;
    }, 3000);
  }
</script>

<div class="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 select-none touch-none overflow-hidden font-sans relative">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
      <span class="font-black text-sm text-amber-400 tracking-wider">DERBY RACE LIVE</span>
    </div>
    <span class="text-xs font-mono font-bold text-slate-400">
      {triviaData ? 'TRIVIA HAZARD' : 'SWIPE CONTROLLER'}
    </span>
  </header>

  <!-- IF TRIVIA HAZARD IS ACTIVE: FULL-SCREEN TRIVIA INPUT MODAL OR RESULT SCREEN -->
  {#if triviaData}
    <div class="flex-1 flex flex-col justify-between py-2 relative overflow-hidden">
      <!-- Attention Warning Ring Flash Pulse -->
      {#if isAttentionEntering}
        <div class="absolute -inset-2 rounded-3xl border-4 border-amber-400/80 bg-amber-500/20 animate-ping pointer-events-none z-50"></div>
      {/if}

      <!-- IF RESULT IS AVAILABLE: SHOW BOLD CELEBRATION OR PENALTY SCREEN -->
      {#if triviaData.result}
        <div
          class={`flex-1 flex flex-col items-center justify-center p-6 rounded-3xl border-4 shadow-2xl text-center my-auto transition-all animate-result-pop z-20 ${
            triviaData.result === 'correct'
              ? 'bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)]'
              : 'bg-gradient-to-b from-rose-950 via-red-950 to-slate-950 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]'
          }`}
        >
          {#if triviaData.result === 'correct'}
            <!-- Correct Big Badge -->
            <div class="w-20 h-20 rounded-full bg-emerald-500/25 border-4 border-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.7)] animate-bounce">
              <span class="text-4xl text-emerald-300 font-black">✔</span>
            </div>
            <span class="text-xs font-mono font-black text-emerald-300 uppercase tracking-widest bg-emerald-500/20 px-3.5 py-1 rounded-full border border-emerald-400/40 mb-1.5">
              SPEED SURGE ACTIVATED!
            </span>
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-wide">
              CORRECT!
            </h2>
            <div class="mt-4 p-3 bg-emerald-950/70 rounded-2xl border border-emerald-500/40 w-full">
              <p class="text-xs sm:text-sm text-emerald-200 font-extrabold tracking-wide">
                +20 METERS BOOST • MAXIMUM SPEED
              </p>
            </div>
          {:else}
            <!-- Incorrect Big Badge -->
            <div class="w-20 h-20 rounded-full bg-rose-500/25 border-4 border-rose-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(244,63,94,0.7)] animate-shake">
              <span class="text-4xl text-rose-300 font-black">✖</span>
            </div>
            <span class="text-xs font-mono font-black text-rose-300 uppercase tracking-widest bg-rose-500/20 px-3.5 py-1 rounded-full border border-rose-400/40 mb-1.5">
              PENALTY SETBACK!
            </span>
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-wide">
              WRONG ANSWER!
            </h2>
            {#if triviaData.correctOption}
              <div class="mt-4 p-3 bg-rose-950/70 rounded-2xl border border-rose-500/40 w-full text-left">
                <span class="text-[10px] font-mono font-black text-rose-300 uppercase tracking-wider block mb-1">
                  CORRECT ANSWER WAS:
                </span>
                <p class="text-xs sm:text-sm text-white font-bold">
                  {triviaData.correctOption}
                </p>
              </div>
            {/if}
          {/if}

          <div class="mt-6 text-[11px] font-mono font-bold text-slate-400 tracking-wider animate-pulse uppercase">
            RESUMING RACE CONTROLS...
          </div>
        </div>
      {:else}
        <!-- QUESTION & 4 ANSWER TOUCH OPTIONS -->
        <!-- Attention Siren Header Banner -->
        <div
          class={`bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-amber-500/25 border-2 border-amber-400/90 rounded-2xl p-3 text-center shadow-lg transition-all ${
            isAttentionEntering ? 'scale-105 shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-pulse' : ''
          }`}
        >
          <div class="flex items-center justify-center gap-2">
            <span class="text-2xl animate-bounce">🧠</span>
            <span class="font-black text-xs text-amber-300 uppercase tracking-widest">
              TRIVIA HAZARD TRIGGERED!
            </span>
          </div>
          <p class="text-[11px] text-slate-200 font-semibold mt-1">
            {triviaData.triggeredBy ? `Hit by ${triviaData.triggeredBy}` : 'Thought bubble hit!'} • Correct = Speed Surge!
          </p>
        </div>

        <!-- Question Card -->
        <div class="bg-slate-900/90 border border-white/20 rounded-2xl p-4 my-2 text-center shadow-2xl">
          <span class="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block mb-1">
            HORSE TRIVIA QUESTION
          </span>
          <h3 class="text-base sm:text-lg font-black text-white leading-snug">
            "{triviaData.question}"
          </h3>
        </div>

        <!-- 4 Large Touch Option Buttons -->
        <div class="grid grid-cols-1 gap-2.5 my-auto">
          {#each triviaData.options as option, idx}
            {@const optionLetters = ['A', 'B', 'C', 'D']}
            {@const isSelected = selectedTriviaAnswer === idx}
            <button
              type="button"
              on:click={() => submitTriviaAnswer(idx)}
              disabled={selectedTriviaAnswer !== null}
              class={`w-full p-3.5 rounded-2xl border-2 font-black text-sm text-left flex items-center justify-between transition-all active:scale-95 shadow-md ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 border-white shadow-[0_0_25px_rgba(16,185,129,0.6)] scale-[1.02]'
                  : selectedTriviaAnswer !== null
                  ? 'bg-slate-900/50 text-slate-500 border-slate-800'
                  : 'bg-slate-850 hover:bg-slate-800 active:bg-slate-700 text-white border-slate-700'
              }`}
            >
              <div class="flex items-center gap-3">
                <span
                  class={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs border ${
                    isSelected
                      ? 'bg-slate-950 text-emerald-400 border-emerald-300'
                      : 'bg-white/10 text-white border-white/20'
                  }`}
                >
                  {optionLetters[idx]}
                </span>
                <span class="leading-tight">{option}</span>
              </div>
              {#if isSelected}
                <span class="text-xs font-mono font-black uppercase tracking-wider bg-slate-950/40 px-2 py-0.5 rounded-md">
                  LOCKED ✔
                </span>
              {/if}
            </button>
          {/each}
        </div>

        <!-- Footer Instructions -->
        <div class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {selectedTriviaAnswer !== null ? 'ANSWER LOCKED IN • CHECKING RESULT...' : 'TAP AN OPTION BEFORE TIME RUNS OUT!'}
        </div>
      {/if}
    </div>
  {:else}
    <!-- REGULAR RACING MODE: INTERACTIVE VERTICAL SWIPE TRACK -->
    <div class="flex-1 flex flex-col items-center justify-center my-3 relative min-h-0">
      <!-- Swipe Guide Header & Shift Confirmation Badge -->
      <div class="mb-2 text-center flex flex-col items-center gap-1 z-10">
        {#if lastShiftDirection}
          <div
            class={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg animate-bounce transition-all ${
              lastShiftDirection === 'up'
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/50'
                : 'bg-amber-500 text-slate-950 shadow-amber-500/50'
            }`}
          >
            {lastShiftDirection === 'up' ? '▲ SHIFTING UP (INNER)' : '▼ SHIFTING DOWN (OUTER)'}
          </div>
        {:else}
          <div class="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>↕️</span>
            <span>SWIPE UP / DOWN TO SHIFT LANES</span>
          </div>
        {/if}
      </div>

      <!-- Main Touch / Swipe Area -->
      <div
        on:pointerdown={handlePointerDown}
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointercancel={handlePointerCancel}
        class={`w-full max-w-sm flex-1 max-h-[380px] min-h-[220px] rounded-3xl relative flex flex-col justify-between items-center p-4 border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none touch-none overflow-hidden ${
          isDragging
            ? 'bg-slate-900/90 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.3)]'
            : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-700/80 shadow-2xl'
        }`}
      >
        <!-- Background Race Track Lane Markings -->
        <div class="absolute inset-0 flex flex-col justify-evenly pointer-events-none opacity-20 px-4">
          <div class="w-full border-b border-dashed border-white"></div>
          <div class="w-full border-b border-dashed border-white"></div>
          <div class="w-full border-b border-dashed border-white"></div>
          <div class="w-full border-b border-dashed border-white"></div>
        </div>

        <!-- Top Swipe Zone: UP / INNER RAIL -->
        <button
          type="button"
          on:click|stopPropagation={() => moveLane(-1)}
          class={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all z-10 ${
            lastShiftDirection === 'up' || dragOffsetY < -15
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
              : 'bg-slate-800/60 text-slate-300 border border-slate-700/60 active:scale-95'
          }`}
        >
          <span class={`text-2xl transition-transform ${dragOffsetY < -15 ? '-translate-y-1' : ''}`}>▲</span>
          <span class="text-[11px] font-black tracking-wider uppercase">SWIPE UP • INNER LANE</span>
        </button>

        <!-- Center Draggable Touch Puck / Dynamic Track Slider -->
        <div class="relative w-full flex items-center justify-center my-auto pointer-events-none z-20">
          <!-- Vertical guide rail track line -->
          <div class="absolute w-2 h-32 bg-slate-800/80 rounded-full border border-slate-700/60 -z-10 flex flex-col justify-between py-2 items-center">
            <div class="w-1 h-1 rounded-full bg-emerald-400/50"></div>
            <div class="w-1 h-1 rounded-full bg-slate-500"></div>
            <div class="w-1 h-1 rounded-full bg-amber-400/50"></div>
          </div>

          <!-- Draggable Puck -->
          <div
            class="w-24 h-14 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-amber-400 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-transform duration-75"
            style={`transform: translateY(${dragOffsetY}px);`}
          >
            <span class="text-xl">🏇</span>
            <div class="flex flex-col items-center">
              <span class="text-[9px] font-black text-amber-400 uppercase tracking-wider leading-none">PULL / SWIPE</span>
              <span class="text-[8px] font-bold text-slate-400 uppercase leading-none mt-0.5">LANE SHIFT</span>
            </div>
          </div>
        </div>

        <!-- Bottom Swipe Zone: DOWN / OUTER RAIL -->
        <button
          type="button"
          on:click|stopPropagation={() => moveLane(1)}
          class={`w-full py-2.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all z-10 ${
            lastShiftDirection === 'down' || dragOffsetY > 15
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
              : 'bg-slate-800/60 text-slate-300 border border-slate-700/60 active:scale-95'
          }`}
        >
          <span class="text-[11px] font-black tracking-wider uppercase">SWIPE DOWN • OUTER LANE</span>
          <span class={`text-2xl transition-transform ${dragOffsetY > 15 ? 'translate-y-1' : ''}`}>▼</span>
        </button>
      </div>
    </div>

    <!-- Bottom Action Boost Buttons: Whip & Steroid Rage -->
    <div class="grid grid-cols-2 gap-3 mb-1 shrink-0">
      <!-- Whip Boost Button -->
      <button
        on:click={triggerWhip}
        disabled={whipCooldown}
        class={`py-4 rounded-2xl font-black text-base uppercase tracking-wider shadow-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
          whipCooldown
            ? 'bg-slate-800 text-slate-500 border border-slate-700'
            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-2 border-white shadow-amber-500/30'
        }`}
      >
        <span class="text-2xl">🔥</span>
        <span>{whipCooldown ? 'BURNING...' : 'WHIP BOOST'}</span>
      </button>

      <!-- Steroid Rage Button -->
      <button
        on:click={triggerSteroid}
        disabled={steroidCooldown}
        class={`py-4 rounded-2xl font-black text-base uppercase tracking-wider shadow-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
          steroidCooldown
            ? 'bg-slate-800 text-slate-500 border border-slate-700'
            : 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-2 border-white animate-pulse shadow-red-500/30'
        }`}
      >
        <span class="text-2xl">⚡</span>
        <span>{steroidCooldown ? 'RECHARGING...' : 'STEROID RAGE'}</span>
      </button>
    </div>
  {/if}
</div>

<style>
  @keyframes resultPop {
    0% {
      transform: scale(0.85);
      opacity: 0;
    }
    60% {
      transform: scale(1.05);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes penaltyShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
  }

  .animate-result-pop {
    animation: resultPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .animate-shake {
    animation: penaltyShake 0.4s ease-in-out;
  }
</style>
