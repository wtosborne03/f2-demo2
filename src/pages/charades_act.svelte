<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";
  import type { CharadesData } from "../types/page_data";
  import { Button } from "m3-svelte";

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
    class="bg-linear-to-br from-orange-600/40 to-yellow-600/40 rounded-3xl p-6 max-w-xl w-full border-4 flex flex-col justify-center items-stretch gap-4 border-purple-500/30 shadow-2xl"
  >
    <h3 class="text-xl font-bold mb-2">Time to Perform!</h3>
    <div class="bg-black/40 rounded-2xl p-4 mb-2 border-2 border-purple-400/50">
      <h5 class="text-4xl font-semibold text-yellow-300">
        {m_data.prompt}
      </h5>
    </div>
    <p class="text-lg text-gray-300 mb-2 italic">
      Act it out - don't say what you are! 🤫
    </p>
    <div class="btn-wrapper">
      <Button
        variant="filled"
        onclick={confirm}
      >
        ✓ I'm Done Acting!
      </Button>
    </div>
  </div>
</div>

<style>
  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.5rem 0;
    font-size: 1.25rem;
    font-weight: bold;
    background-color: var(--m3c-error);
    color: var(--m3c-on-error);
  }
</style>
