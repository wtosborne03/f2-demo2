<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: any;
  m_data = get(gameState).page_data;

  function submit_answer(index: number) {
    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: index,
    });
  }
</script>

<div class="container h-full mx-auto w-full flex flex-col justify-center items-center p-4">
  <!-- Mystical Cursed Voting Card -->
  <div
    class="relative bg-gradient-to-br from-[#2a081a] to-[#110109] border-4 border-[#ef4444] rounded-3xl w-full max-w-sm p-4 shadow-[0_0_30px_rgba(239,68,68,0.4)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
  >
    <!-- Header Badge -->
    <div class="flex items-center justify-center gap-2">
      <span class="text-3xl animate-pulse">🔮</span>
      <span class="text-lg font-black text-[#fca5a5] uppercase tracking-widest text-center">Who Cast the Twist?</span>
    </div>

    <!-- Cursed Image -->
    {#if m_data?.image}
      <div class="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-[#ef4444]/40 shadow-inner">
        <img
          src={m_data.image}
          alt="Cursed Wish Visual"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
        {#if m_data?.summary}
          <div class="absolute bottom-0 left-0 right-0 p-3 text-center text-xs font-semibold text-[#fca5a5] italic leading-tight">
            "{m_data.summary}"
          </div>
        {/if}
      </div>
    {/if}

    <!-- Choices list -->
    <div class="flex flex-col gap-2.5 w-full">
      {#each m_data?.answers || [] as answer, idx}
        <button
          class="w-full py-3 px-4 rounded-xl border-2 border-[#ef4444]/30 bg-[#18030e]/80 hover:bg-[#ef4444]/20 hover:border-[#ef4444] active:scale-95 transition-all text-white font-extrabold text-sm tracking-wide shadow-md flex items-center justify-center gap-2"
          on:click={() => submit_answer(idx)}
        >
          <span class="text-xs text-[#fca5a5]">🐾</span> {answer}
        </button>
      {/each}
    </div>
  </div>
</div>
