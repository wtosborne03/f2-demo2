<script lang="ts">
  import { get } from "svelte/store";
  import type { CharadesData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }

  let m_data: CharadesData;
  m_data = get(gameState).page_data;
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full flex flex-col items-stretch gap-4">
    <h3 class="text-2xl font-black text-primary text-center">
      🎭 Your Acting Prompt
    </h3>
    
    <div class="bg-base-300 rounded-2xl p-4 mb-2 border border-base-100">
      <div class="text-3xl font-black text-secondary text-center leading-snug">
        {m_data.prompt}
      </div>
    </div>
    
    <div class="bg-error/10 text-error rounded-2xl p-4 mb-2 border border-error/20 flex flex-col items-center justify-center">
      <p class="text-base font-bold text-center leading-relaxed">
        🤫 Do NOT reveal your prompt or say any part of it out loud!
      </p>
      <p class="text-xs opacity-70 text-center mt-2 italic">
        (Pretty Please? 🥺)
      </p>
    </div>
    
    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      onclick={confirm}
    >
      ✨ Ready to Act! 🤹‍♂️
    </button>
  </div>
</div>
