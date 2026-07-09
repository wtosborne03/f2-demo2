<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div
  class="wait-container flex flex-col justify-center items-center w-full h-full p-6 text-white text-center"
>
  <div class="pulse-ring mb-8">
    <div class="inner-circle">🎵</div>
  </div>

  <h1 class="text-xl font-bold uppercase tracking-wider text-purple-400">
    Waiting for Song Selector
  </h1>
  <p class="text-zinc-400 text-sm mt-3 max-w-xs leading-relaxed">
    {#if $gameState.page_data?.selectorName}
      <span class="font-extrabold text-white"
        >{$gameState.page_data.selectorName}</span
      > is currently choosing the music video.
    {:else}
      A player is picking the music video.
    {/if}
  </p>
  <p
    class="text-zinc-600 text-xs mt-10 uppercase tracking-widest font-semibold animate-pulse"
  >
    Get ready to guess the lyrics...
  </p>
</div>


<style>
  .wait-container {
    height: 100%;
    box-sizing: border-box;
  }

  .pulse-ring {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pulse-ring::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(139, 92, 246, 0.2);
    animation: ringPulse 1.8s ease-out infinite;
  }

  .inner-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #6d28d9;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    box-shadow: 0 0 20px rgba(109, 40, 217, 0.5);
    z-index: 2;
  }

  @keyframes ringPulse {
    0% {
      transform: scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
</style>
