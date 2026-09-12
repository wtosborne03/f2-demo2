<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface AnswerPageData {
    question: string;
    answers: string[];
    roundNumber?: number;
    totalRounds?: number;
  }

  const pData = (get(gameState).page_data || {}) as AnswerPageData;
  const letters = ["A", "B", "C", "D"];

  let selectedIdx: number | null = null;
  let isSubmitted = false;

  function submitAnswer(idx: number) {
    if (isSubmitted) return;
    selectedIdx = idx;
    isSubmitted = true;
    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: idx,
    });
  }
</script>

<div
  class="min-h-full w-full flex flex-col justify-center items-center p-4 bg-[#0c0a09] text-[#e7e5e4] font-mono select-none"
>
  <!-- Top Round Badge -->
  <div class="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-[#1c1917] text-[#f59e0b] border border-[#78350f] rounded text-xs font-bold uppercase tracking-wider">
    <span>🍺</span>
    <span>ROUND {pData.roundNumber || 1} OF {pData.totalRounds || 4}</span>
  </div>

  {#if !isSubmitted}
    <!-- Question Card -->
    <div class="w-full max-w-sm bg-[#1e293b] border-2 border-[#0f172a] rounded-lg p-3.5 mb-4 shadow-xl text-center">
      <div class="text-sm font-bold text-[#f1f5f9] leading-snug">
        {pData.question || "Look at the TV screen for the question..."}
      </div>
    </div>

    <!-- 4 Tactile Coaster Answer Options -->
    <div class="w-full max-w-sm flex flex-col gap-2.5">
      {#each pData.answers as answer, i}
        <button
          type="button"
          on:click={() => submitAnswer(i)}
          class="w-full flex items-center gap-3 p-3.5 bg-[#d6c7a1] text-[#1c1917] border-2 border-[#785a3c] border-b-4 border-b-[#443220] rounded-xl shadow-lg active:translate-y-1 active:border-b-2 transition-transform text-left cursor-pointer"
        >
          <!-- Coaster Stamp Letter -->
          <div class="w-8 h-8 rounded-full border border-dashed border-[#5c4426] bg-[#fbfbf9] flex items-center justify-center font-black text-base shrink-0">
            {letters[i]}
          </div>

          <!-- Answer text -->
          <div class="font-bold text-sm leading-snug grow">
            {answer}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Locked In Stamped Coaster -->
    <div
      class="w-full max-w-sm bg-[#d6c7a1] text-[#1c1917] border-4 border-[#5c4426] p-6 shadow-2xl rounded-xl rotate-1 text-center"
    >
      <div class="text-4xl mb-2">🔒</div>
      <div class="text-xs uppercase font-black tracking-widest text-[#78350f]">
        ANSWER LOCKED IN!
      </div>
      <div class="text-lg font-black uppercase mt-1 mb-2">
        "{pData.answers[selectedIdx ?? 0]}"
      </div>
      <div class="mt-3 px-3 py-1.5 bg-[#1c1917] text-[#f59e0b] text-xs font-bold uppercase rounded inline-block">
        WATCH TV FOR THE REVEAL
      </div>
    </div>
  {/if}
</div>
