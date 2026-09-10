<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div class="speedway-wait-screen flex flex-col justify-center items-center h-full w-full min-h-screen text-center select-none px-6 gap-6">
  <div class="arcade-time text-4xl sm:text-5xl md:text-6xl font-black tracking-widest text-yellow-300">
    {$gameState.page_data?.finishTime || "0:00.00"}
  </div>

  {#if typeof $gameState.page_data?.coins === "number"}
    <div class="arcade-coins text-lg sm:text-xl font-bold text-yellow-400">
      🪙 x{String($gameState.page_data.coins).padStart(2, "0")}
    </div>
  {/if}

  <div class="arcade-wait text-xs sm:text-sm text-gray-400 mt-3">
    WAITING FOR PLAYERS...
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

  .speedway-wait-screen {
    font-family: 'Press Start 2P', monospace, sans-serif;
  }

  .arcade-time {
    text-shadow: 4px 4px 0 #000000;
  }

  .arcade-coins {
    text-shadow: 2px 2px 0 #000000;
  }

  .arcade-wait {
    letter-spacing: 0.1rem;
    text-shadow: 1px 1px 0 #000000;
    animation: arcade-wait-blink 1s steps(2) infinite;
  }

  @keyframes arcade-wait-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.35; }
  }
</style>
