<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: any;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    if (!answer_text.trim()) return;
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text.trim(),
    });
  }
</script>

<div class="container h-full mx-auto w-full flex flex-col justify-center items-center p-4">
  <!-- Mystical Card Container -->
  <div
    class="relative bg-gradient-to-br from-[#1e1135] to-[#0f071d] border-4 border-[#f59e0b] rounded-3xl w-full max-w-sm aspect-square p-5 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col justify-between"
  >
    <!-- Header Badge -->
    <div class="flex items-center justify-center gap-2 mb-2">
      <span class="text-3xl">🐾</span>
      <span class="text-xl font-extrabold text-[#fef08a] uppercase tracking-wider">Make a Wish</span>
    </div>

    <!-- Instructions -->
    <div class="text-sm text-center text-[#c084fc] font-semibold mb-3">
      {m_data?.topic || "Write down your deepest desire..."}
    </div>

    <!-- Text Input Area -->
    <form class="grow flex flex-col w-full" on:submit|preventDefault={submit_prompt}>
      <textarea
        class="w-full h-full bg-[#0a0414]/80 border-2 border-[#a855f7]/40 rounded-xl p-3 resize-none outline-none text-lg text-white placeholder-purple-300/50 text-center flex items-center justify-center leading-relaxed focus:border-[#f59e0b] transition-colors"
        placeholder={m_data?.placeholder || "I wish I had a million dollars..."}
        bind:value={answer_text}
        maxlength="80"
      ></textarea>
    </form>
  </div>

  <!-- Submit Button -->
  <div class="mt-6">
    <GameSubmit onSubmit={submit_prompt} />
  </div>
</div>
