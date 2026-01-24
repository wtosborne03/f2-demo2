<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { CharadesData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }

  let m_data: CharadesData;
  m_data = get(gameState).page_data;
</script>

<div
  class="h-full overflow-y-auto mx-auto w-full flex flex-col justify-center items-center p-2"
>
  <div
    class="bg-linear-to-br from-purple-900/20 to-pink-900/20 rounded-3xl flex flex-col justify-center items-stretch gap-4 p-3 max-w-2xl h-fit w-full border-4 border-purple-500/30 shadow-2xl"
  >
    <h3 class="text-xl font-bold mb-2 text-purple-300 text-center">
      🎭 Your Acting Prompt 🎭
    </h3>
    <div class="bg-black/40 rounded-2xl p-2 mb-2 border-2 border-purple-400/50">
      <div class="text-4xl font-bold text-yellow-300 text-center">
        {m_data.prompt}
      </div>
    </div>
    <div class="bg-red-900/30 rounded-xl p-2 mb-2 border-2 border-red-500/50">
      <p class="text-xl font-semibold text-red-300 text-center">
        🤫 Do NOT reveal your prompt or say any part of it out loud!
      </p>
      <p class="text-lg text-gray-300 text-center mt-2 italic">
        (Pretty Please? 🥺)
      </p>
    </div>
    <button
      style="font-size: 1.5rem;"
      class="btn preset-filled w-full px-6 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
      on:click={confirm}>✨ Ready to Act! 🤹‍♂️</button
    >
  </div>
</div>
