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
  <div
    class="relative bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] border-4 border-[#a855f7] rounded-3xl w-full max-w-sm p-5 shadow-[0_0_30px_rgba(168,85,247,0.4)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-fade-in"
  >
    <div class="flex items-center justify-center gap-2">
      <span class="text-3xl animate-bounce">🏆</span>
      <span class="text-lg font-black text-[#e9d5ff] uppercase tracking-widest text-center">Best Twist!</span>
    </div>

    <div class="text-sm text-center text-[#c084fc] font-semibold">
      {m_data?.question || "Vote for the most creative/best twist!"}
    </div>

    <!-- Choices list -->
    <div class="flex flex-col gap-3 w-full grow justify-center">
      {#each m_data?.answers || [] as answer, idx}
        <button
          class="w-full py-4 px-4 rounded-2xl border-2 border-[#a855f7]/30 bg-[#0f0b21]/80 hover:bg-[#a855f7]/20 hover:border-[#a855f7] active:scale-95 transition-all text-white font-extrabold text-sm tracking-wide shadow-lg flex flex-col items-center justify-center gap-1"
          on:click={() => submit_answer(idx)}
        >
          <span class="text-xs text-[#c084fc] font-normal uppercase tracking-wider">Option #{idx + 1}</span>
          <span class="text-center text-sm leading-relaxed text-[#fef08a]">"{answer.catch}"</span>
          <span class="text-xs text-[#a78bfa]/80 italic">Wish: {answer.wish}</span>
        </button>
      {/each}
    </div>
  </div>
</div>
