<script lang="ts">
  import type { QuestionData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  // Reactive subscription to page_data with safe fallbacks
  $: m_data = ($gameState?.page_data || {}) as any;
  $: answers = (m_data?.answers || []) as string[];
  $: question = m_data?.question || "";

  const letters = ["A", "B", "C", "D"];

  let selectedIndex: number | null = null;
  let isSubmitted = false;
  let lastQuestion = "";

  // Reset submission state ONLY when question changes
  $: if (question && question !== lastQuestion) {
    lastQuestion = question;
    selectedIndex = null;
    isSubmitted = false;
  }

  function submit_answer(index: number) {
    if (isSubmitted) return;
    selectedIndex = index;
    isSubmitted = true;
    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: index,
    });
  }
</script>

<div
  class="flex flex-col justify-center items-center min-h-full w-full max-w-md mx-auto px-5 py-6 text-center select-none"
>
  {#if !isSubmitted}
    <!-- Question Card -->
    {#if question}
      <div
        class="w-full bg-[#10141a] text-[#f8fafc] border-2 border-[#1e293b] rounded-xl p-4 mb-4 shadow-xl text-center"
      >
        <div class="text-sm font-bold leading-snug tracking-wide">
          {question}
        </div>
      </div>
    {/if}

    <!-- Multiple Choice Options -->
    <div class="w-full flex flex-col gap-3">
      {#each answers as answer, idx}
        <button
          type="button"
          on:click={() => submit_answer(idx)}
          class="w-full flex items-center gap-3.5 p-4 bg-[#d6c7a1] text-[#1c1917] border-2 border-[#785a3c] border-b-4 border-b-[#3d2817] rounded-xl shadow-lg active:translate-y-1 active:border-b-2 transition-transform text-left cursor-pointer"
        >
          <!-- Metal Bottle Cap Letter Badge -->
          <div
            class="w-9 h-9 rounded-full bg-gradient-to-br from-[#f59e0b] via-[#b45309] to-[#78350f] border-2 border-[#fbbf24] shadow-md flex items-center justify-center font-black text-sm text-white shrink-0"
          >
            {letters[idx] || `${idx + 1}`}
          </div>

          <!-- Answer text -->
          <div class="font-bold text-base leading-snug grow">
            {answer}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Stamped Locked In Badge -->
    <div
      class="w-full bg-[#d6c7a1] text-[#1c1917] border-4 border-[#5c4426] p-6 shadow-2xl rounded-xl text-center rotate-1"
    >
      <div class="text-4xl mb-2">🔒</div>
      <div class="text-xs uppercase font-black tracking-widest text-[#78350f]">
        ANSWER LOCKED IN!
      </div>
      <div class="text-lg font-black uppercase mt-1 mb-2">
        "{answers[selectedIndex ?? 0] || 'SUBMITTED'}"
      </div>
      <div class="mt-3 px-3 py-1.5 bg-[#1c1917] text-[#f59e0b] text-xs font-bold uppercase rounded inline-block">
        WATCH TV FOR THE REVEAL
      </div>
    </div>
  {/if}
</div>
