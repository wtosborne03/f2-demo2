<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div class="flex flex-col justify-between items-center h-full w-full min-h-screen p-6 text-center select-none overflow-hidden"
  style="background: radial-gradient(circle at center, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 1) 100%);">

  <!-- Top Header -->
  <div class="flex flex-col items-center mt-8 gap-2">
    <div class="text-5xl animate-bounce">🏁</div>
    <h1 class="text-3xl font-black tracking-wider text-white uppercase drop-shadow-md">
      Race Finished!
    </h1>
    <div class="badge badge-lg font-bold px-4 py-3 text-sm shadow-md"
      style="background-color: {$gameState.color || '#00f0ff'}; color: #05060b;">
      {$gameState.name || "Racer"}
    </div>
  </div>

  <!-- Center Card: Final Time Display -->
  <div class="w-full max-w-sm bg-slate-900/80 border-2 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 backdrop-blur-md"
    style="border-color: {$gameState.color || '#00f0ff'}; box-shadow: 0 0 30px rgba(0, 240, 255, 0.25);">

    <span class="text-xs font-black tracking-widest uppercase text-slate-400">
      Your Final Time
    </span>

    <div class="text-4xl sm:text-5xl font-mono font-black tracking-tight"
      style="color: #ffd700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.6);">
      ⏱️ {$gameState.page_data?.finishTime || "0:00.00"}
    </div>

    {#if typeof $gameState.page_data?.coins === "number"}
      <div class="flex items-center gap-2 text-lg font-bold text-amber-300 bg-amber-950/40 px-4 py-1.5 rounded-full border border-amber-500/30">
        <span>🪙</span>
        <span>{$gameState.page_data.coins} Coins Collected</span>
      </div>
    {/if}
  </div>

  <!-- Bottom: Waiting on Other Players to Finish -->
  <div class="flex flex-col items-center mb-8 gap-3">
    <div class="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-300">
      <span class="loading loading-spinner loading-md text-info"></span>
      <span>Waiting on other players to finish...</span>
    </div>
    <p class="text-xs text-slate-500 font-medium max-w-xs">
      Look at the main TV screen to watch the remaining racers and victory ceremony!
    </p>
  </div>
</div>

