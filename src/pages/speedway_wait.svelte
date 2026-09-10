<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div class="flex flex-col justify-center items-center h-full w-full min-h-screen text-center select-none px-6 gap-6">
  <div class="text-6xl sm:text-7xl font-mono font-black tracking-tight text-white">
    {$gameState.page_data?.finishTime || "0:00.00"}
  </div>

  {#if typeof $gameState.page_data?.coins === "number"}
    <div class="text-xl font-bold text-yellow-400">
      🪙 {$gameState.page_data.coins} coins
    </div>
  {/if}

  <div class="text-base text-gray-400 font-medium mt-2">
    Waiting on other players to finish...
  </div>
</div>
