<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";
  import type { CharadesData } from "../types/page_data";

  let m_data: CharadesData;
  m_data = get(gameState).page_data;

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }
</script>

<div
  class="container h-full overflow-y-auto mx-auto w-full flex flex-col justify-center items-center text-center p-2"
>
  <div
    class="bg-linear-to-br from-orange-600/40 to-yellow-600/40 rounded-3xl p-2 max-w-2xl w-full border-4 flex flex-col justify-center items-stretch gap-2 border-purple-500/30 shadow-2xl"
  >
    <h3 class="text-xl font-bold mb-2">Time to Perform!</h3>
    <div class="bg-black/40 rounded-2xl p-2 mb-2 border-2 border-purple-400/50">
      <h5 class="text-4xl font-semibold text-yellow-300">
        {m_data.prompt}
      </h5>
    </div>
    <p class="text-lg text-gray-300 mb-2 italic">
      Act it out - don't say what you are! 🤫
    </p>
    <button
      style="font-size: 1.5rem;"
      class="btn preset-filled-error-300-700 px-6 py-2 rounded-xl font-bold shadow-2xl hover:scale-105 transition-transform"
      on:click={confirm}>✓ I'm Done Acting!</button
    >
  </div>
</div>
