<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';

  // Lane Shift Indicator State
  let lastShiftDirection: 'up' | 'down' | null = null;
  let shiftIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

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
    }, 400);
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

<div class="w-full h-full min-h-screen bg-[#12100e] text-[#fcf8f2] flex flex-col justify-between p-4 sm:p-6 select-none touch-none overflow-hidden max-w-md mx-auto relative font-sans">
  <!-- Rustic Header Bar -->
  <header class="flex items-center justify-between border-b border-[#3e342b] pb-3 shrink-0">
    <div class="flex items-center gap-2.5">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
      <span class="font-extrabold text-sm sm:text-base text-[#f59e0b] tracking-wider font-mono">
        DERBY RACER
      </span>
    </div>
    <div class="badge badge-outline border-[#54473b] text-[#d6c7b2] font-mono text-[11px] uppercase tracking-wider py-2 px-3">
      {triviaData ? 'TRIVIA HAZARD' : 'STEERING'}
    </div>
  </header>

  <!-- TRIVIA HAZARD MODE -->
  {#if triviaData}
    <div class="flex-1 flex flex-col justify-between py-4 relative">
      {#if isAttentionEntering}
        <div class="absolute -inset-2 rounded-3xl border-2 border-amber-500/70 bg-amber-500/10 animate-ping pointer-events-none z-50"></div>
      {/if}

      {#if triviaData.result}
        <!-- Result Screen (DaisyUI Card) -->
        <div
          class={`card flex-1 flex flex-col items-center justify-center p-6 border-2 shadow-2xl text-center my-auto transition-all animate-result-pop z-20 ${
            triviaData.result === 'correct'
              ? 'bg-[#14281d] border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
              : 'bg-[#2a1314] border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.3)]'
          }`}
        >
          {#if triviaData.result === 'correct'}
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3 text-3xl font-black text-emerald-300">
              ✔
            </div>
            <div class="badge badge-success badge-sm font-mono font-black uppercase tracking-wider mb-2">
              SPEED SURGE
            </div>
            <h2 class="text-2xl font-black text-[#fcf8f2] tracking-wide">
              CORRECT!
            </h2>
            <div class="mt-4 p-3 bg-[#0d1e15] rounded-xl border border-emerald-500/30 w-full text-center">
              <p class="text-xs sm:text-sm text-emerald-200 font-bold">
                +20M SURGE BOOST ACTIVATED
              </p>
            </div>
          {:else}
            <div class="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center mb-3 text-3xl font-black text-rose-300 animate-shake">
              ✖
            </div>
            <div class="badge badge-error badge-sm font-mono font-black uppercase tracking-wider mb-2">
              PENALTY SETBACK
            </div>
            <h2 class="text-2xl font-black text-[#fcf8f2] tracking-wide">
              WRONG ANSWER!
            </h2>
            {#if triviaData.correctOption}
              <div class="mt-4 p-3 bg-[#1e0d0e] rounded-xl border border-rose-500/30 w-full text-left">
                <span class="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider block mb-1">
                  CORRECT ANSWER:
                </span>
                <p class="text-xs sm:text-sm text-[#fcf8f2] font-semibold">
                  {triviaData.correctOption}
                </p>
              </div>
            {/if}
          {/if}
          <span class="mt-6 text-[11px] font-mono font-bold text-[#a89984] tracking-widest uppercase animate-pulse">
            RESUMING CONTROLS...
          </span>
        </div>
      {:else}
        <!-- Question & ABCD Answers (DaisyUI Buttons) -->
        <div class="card bg-[#191512] border border-[#3e342b] p-4 text-center shadow-lg">
          <span class="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
            HORSE TRIVIA HAZARD
          </span>
          <h3 class="text-base sm:text-lg font-extrabold text-[#fcf8f2] leading-snug">
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
              class={`btn btn-block h-auto py-3 px-4 rounded-xl border font-bold text-sm text-left flex items-center justify-between transition-all ${
                isSelected
                  ? 'btn-warning text-[#12100e] border-amber-400 shadow-lg scale-[1.01]'
                  : selectedTriviaAnswer !== null
                  ? 'btn-neutral opacity-40 border-[#3e342b]'
                  : 'bg-[#221c17] hover:bg-[#2c241e] text-[#fcf8f2] border-[#3e342b] active:scale-[0.98]'
              }`}
            >
              <div class="flex items-center gap-3">
                <span class={`badge ${isSelected ? 'badge-neutral font-black text-amber-300' : 'badge-ghost text-[#d6c7b2]'} font-mono text-xs`}>
                  {optionLetters[idx]}
                </span>
                <span class="leading-tight">{option}</span>
              </div>
              {#if isSelected}
                <span class="text-[10px] font-mono font-black uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded">
                  LOCKED ✔
                </span>
              {/if}
            </button>
          {/each}
        </div>

        <div class="text-center text-[10px] font-mono font-bold text-[#a89984] uppercase tracking-widest">
          {selectedTriviaAnswer !== null ? 'ANSWER LOCKED IN • WATCH TV' : 'TAP AN OPTION BEFORE TIME EXPIRES'}
        </div>
      {/if}
    </div>
  {:else}
    <!-- REGULAR RACING STEERING: MINIMAL UP / DOWN ARROW TOUCH CONTROLLER -->
    <div class="flex-1 flex flex-col justify-between py-4 gap-4">
      <!-- UP / INNER LANE BUTTON -->
      <button
        type="button"
        on:click={() => moveLane(-1)}
        class={`btn flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all active:scale-[0.97] shadow-xl ${
          lastShiftDirection === 'up'
            ? 'btn-warning border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-[1.02]'
            : 'bg-[#1e1814] hover:bg-[#28201a] text-[#fcf8f2] border-[#3e342b]'
        }`}
      >
        <span class="text-4xl sm:text-5xl font-black text-amber-400">▲</span>
        <div class="flex flex-col items-center">
          <span class="text-base sm:text-lg font-black tracking-wider uppercase">
            SHIFT UP
          </span>
          <span class="text-[11px] font-mono font-bold text-[#a89984] tracking-widest uppercase mt-0.5">
            INNER RAIL
          </span>
        </div>
      </button>

      <!-- Center Status Divider -->
      <div class="flex items-center justify-center gap-3 py-1">
        <div class="flex-1 h-px bg-[#3e342b]"></div>
        <span class="text-[10px] font-mono font-bold text-[#8c7e6d] uppercase tracking-widest">
          LANE STEERING
        </span>
        <div class="flex-1 h-px bg-[#3e342b]"></div>
      </div>

      <!-- DOWN / OUTER LANE BUTTON -->
      <button
        type="button"
        on:click={() => moveLane(1)}
        class={`btn flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all active:scale-[0.97] shadow-xl ${
          lastShiftDirection === 'down'
            ? 'btn-warning border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] scale-[1.02]'
            : 'bg-[#1e1814] hover:bg-[#28201a] text-[#fcf8f2] border-[#3e342b]'
        }`}
      >
        <div class="flex flex-col items-center">
          <span class="text-base sm:text-lg font-black tracking-wider uppercase">
            SHIFT DOWN
          </span>
          <span class="text-[11px] font-mono font-bold text-[#a89984] tracking-widest uppercase mt-0.5">
            OUTER RAIL
          </span>
        </div>
        <span class="text-4xl sm:text-5xl font-black text-amber-400">▼</span>
      </button>
    </div>

    <!-- Minimal Rustic Footer Info -->
    <footer class="text-center text-[10px] font-mono font-bold text-[#736657] uppercase tracking-wider pt-2 border-t border-[#2d251f]">
      TAP ARROWS TO AVOID OBSTACLES
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
