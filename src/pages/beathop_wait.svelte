<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div
  class="flex flex-col justify-center items-center w-full h-full p-6 text-zinc-100 text-center font-sans"
>
  <div class="relative w-12 h-12 mb-6 flex items-center justify-center">
    <div class="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
    <div
      class="absolute inset-0 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
    ></div>
    <span class="text-sm opacity-60">🎵</span>
  </div>

  <h1 class="text-base font-semibold tracking-tight text-zinc-200">
    Waiting for Song Selector
  </h1>

  <p class="text-xs text-zinc-400 mt-2 max-w-xs leading-normal">
    {#if $gameState.page_data?.selectorName}
      <span class="font-medium text-zinc-200">
        {$gameState.page_data.selectorName}
      </span> is choosing the music video.
    {:else}
      A player is picking the music video.
    {/if}
  </p>

  <p
    class="text-[10px] text-zinc-500 mt-12 uppercase tracking-widest font-mono animate-pulse"
  >
    Get ready to guess...
  </p>
</div>
