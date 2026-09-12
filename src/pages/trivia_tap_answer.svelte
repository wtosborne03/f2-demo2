<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface AnswerPageData {
    question?: string;
    answers?: string[];
    roundNumber?: number;
    totalRounds?: number;
  }

  $: pData = ($gameState?.page_data || {}) as AnswerPageData;
  $: answers = (pData?.answers || []) as string[];
  $: question = pData?.question || "";
  $: roundNumber = pData?.roundNumber || 1;
  $: totalRounds = pData?.totalRounds || 4;

  const letters = ["A", "B", "C", "D"];

  let selectedIdx: number | null = null;
  let isSubmitted = false;
  let lastQuestion = "";

  $: if (question && question !== lastQuestion) {
    lastQuestion = question;
    selectedIdx = null;
    isSubmitted = false;
  }

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
    <span>ROUND {roundNumber} OF {totalRounds}</span>
  </div>

  {#if !isSubmitted}
    <!-- Question Card (Dark Charcoal Slate with Chalk Highlight) -->
    <div class="w-full max-w-sm bg-[#0f172a] border-2 border-[#1e293b] rounded-lg p-4 mb-4 shadow-xl text-center">
      <div class="text-sm font-bold text-[#f8fafc] leading-snug tracking-wide">
        {question || "Look at the TV screen for the question..."}
      </div>
    </div>

    <!-- 4 Tactile Coaster Answer Options -->
    <div class="w-full max-w-sm flex flex-col gap-3">
      {#each answers as answer, i}
        <button
          type="button"
          on:click={() => submitAnswer(i)}
          class="w-full flex items-center gap-3.5 p-3.5 bg-[#d6c7a1] text-[#1c1917] border-2 border-[#785a3c] border-b-4 border-b-[#3d2817] rounded-xl shadow-lg active:translate-y-1 active:border-b-2 transition-transform text-left cursor-pointer"
        >
          <!-- Metal Bottle Cap Letter Badge -->
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#78350f] border-2 border-[#fbbf24] shadow-md flex items-center justify-center font-black text-sm text-white shrink-0">
            {letters[i] || `${i + 1}`}
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
        "{answers[selectedIdx ?? 0] || 'LOCKED IN'}"
      </div>
      <div class="mt-3 px-3 py-1.5 bg-[#1c1917] text-[#f59e0b] text-xs font-bold uppercase rounded inline-block">
        WATCH TV FOR THE REVEAL
      </div>
    </div>
  {/if}
</div>
