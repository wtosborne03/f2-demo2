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

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full flex flex-col items-stretch gap-4">
    <h3 class="text-2xl font-black text-primary text-center">Time to Perform!</h3>
    
    <div class="bg-base-300 rounded-2xl p-4 mb-2 border border-base-100">
      <h5 class="text-3xl font-black text-secondary leading-snug">
        {m_data.prompt}
      </h5>
    </div>
    
    <p class="text-sm text-base-content/75 mb-2 italic">
      Act it out - don't say what you are! 🤫
    </p>

    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      onclick={confirm}
    >
      ✓ I'm Done Acting!
    </button>
  </div>
</div>
