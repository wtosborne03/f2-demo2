<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  $: m_data = ($gameState?.page_data || {}) as any;
  $: answers = (m_data?.answers || []) as string[];
  $: question = m_data?.question || "";

  const letters = ["A", "B", "C", "D"];

  let selectedIdx: number | null = null;
  let isSubmitted = false;
  let lastQuestion = "";

  // Reset submission state when a new question arrives
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
  class="flex flex-col justify-center items-center min-h-full w-full max-w-md mx-auto px-4 py-4 text-center select-none"
>
  {#if !isSubmitted}
    <!-- Clean Question Card -->
    {#if question}
      <div
        class="w-full bg-base-200/90 text-base-content border border-base-content/15 rounded-xl p-4 mb-4 shadow-md text-center"
      >
        <div class="text-base font-bold leading-snug tracking-wide">
          {question}
        </div>
      </div>
    {/if}

    <!-- Multiple Choice Options -->
    <div class="w-full flex flex-col gap-3">
      {#each answers as answer, idx}
        <button
          type="button"
          on:click={() => submitAnswer(idx)}
          class="w-full flex items-center gap-3.5 p-4 bg-base-200/90 text-base-content hover:bg-base-300 border border-base-content/15 rounded-xl shadow active:scale-[0.98] transition-transform text-left cursor-pointer"
        >
          <!-- Letter Badge -->
          <div
            class="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 shadow-sm"
          >
            {letters[idx] || `${idx + 1}`}
          </div>

          <!-- Answer Text -->
          <div class="font-bold text-base leading-snug grow">
            {answer}
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Locked In State Card -->
    <div
      class="w-full bg-base-200/90 text-base-content border border-amber-500/40 p-6 shadow-xl rounded-xl text-center"
    >
      <div class="text-4xl mb-2">🔒</div>
      <div class="text-xs uppercase font-black tracking-widest text-amber-500">
        ANSWER LOCKED IN!
      </div>
      <div class="text-lg font-black mt-2 mb-3">
        "{answers[selectedIdx ?? 0] || 'SUBMITTED'}"
      </div>
      <div class="text-xs text-base-content/70 font-semibold">
        Watch the TV screen for the reveal!
      </div>
    </div>
  {/if}
</div>
