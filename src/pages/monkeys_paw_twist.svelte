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
  <!-- Cursed Card Container -->
  <div
    class="relative bg-gradient-to-br from-[#2a081a] to-[#14020c] border-4 border-[#ef4444] rounded-3xl w-full max-w-sm p-5 shadow-[0_0_25px_rgba(239,68,68,0.35)] flex flex-col gap-4"
  >
    <!-- Header Badge -->
    <div class="flex items-center justify-center gap-2">
      <span class="text-3xl">🔮</span>
      <span class="text-xl font-black text-[#fca5a5] uppercase tracking-wider">Saboteur Twist</span>
    </div>

    <!-- Target Wish Display Box -->
    <div class="bg-[#18030e]/90 border border-[#f87171]/40 rounded-xl p-3 text-center">
      <div class="text-xs font-bold text-[#fca5a5] uppercase mb-1">
        Target Wish from {m_data?.wishMaker || "Player"}
      </div>
      <div class="text-base font-extrabold text-white italic">
        "{m_data?.wish || "I wish I had a million dollars"}"
      </div>
    </div>

    <!-- Writing Area for Catch -->
    <form class="grow flex flex-col w-full h-36" on:submit|preventDefault={submit_prompt}>
      <textarea
        class="w-full h-full bg-[#0c0107]/90 border-2 border-[#ef4444]/40 rounded-xl p-3 resize-none outline-none text-base text-white placeholder-red-300/40 text-center flex items-center justify-center leading-relaxed focus:border-[#f87171] transition-colors"
        placeholder={m_data?.placeholder || "...but it is entirely in loose pennies!"}
        bind:value={answer_text}
        maxlength="90"
      ></textarea>
    </form>
  </div>

  <!-- Submit Button -->
  <div class="mt-6">
    <GameSubmit onSubmit={submit_prompt} />
  </div>
</div>
