<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { onMount } from "svelte";

  let lastScore = 0;
  let isPressed = false;
  let showScorePop = false;

  $: score = $gameState.score || 0;

  // Pop score indicator when score increases
  $: {
    if (score > lastScore) {
      showScorePop = true;
      const t = setTimeout(() => {
        showScorePop = false;
      }, 500);
      lastScore = score;
    } else if (score < lastScore) {
      lastScore = score; // Reset if new game/round
    }
  }

  function handleJump() {
    isPressed = true;
    setTimeout(() => {
      isPressed = false;
    }, 100);

    // Send high-priority jump input to the host
    gameClient.sendInput({
      type: "jump"
    });

    // Provide haptic feedback if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
</script>

<div class="gameplay-container flex flex-col justify-between items-center w-full h-full p-6 text-white select-none">
  <!-- Top Header with Info & Score -->
  <header class="w-full flex flex-col items-center gap-1 py-4">
    <div class="track-info text-center max-w-xs">
      <span class="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Now Playing</span>
      <h2 class="text-sm font-bold text-zinc-300 truncate mt-0.5">{$gameState.page_data?.title || "Music Video"}</h2>
    </div>
    
    <div class="score-display flex flex-col items-center mt-4 relative">
      <span class="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Your Score</span>
      <span class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mt-1">
        {score}
      </span>
      {#if showScorePop}
        <span class="score-pop text-green-400 font-black text-xl absolute -right-8 top-6 animate-bounce">
          +100
        </span>
      {/if}
    </div>
  </header>

  <!-- Big Interactive Tap Zone -->
  <div class="w-full flex-1 flex justify-center items-center py-6">
    <button 
      class="jump-button-giant flex flex-col justify-center items-center"
      class:pressed={isPressed}
      onclick={handleJump}
      aria-label="Jump Button"
    >
      <div class="glow-ring"></div>
      <span class="jump-text font-black uppercase tracking-wider text-2xl">JUMP!</span>
      <span class="tap-hint text-purple-300 text-xs font-medium uppercase mt-2 opacity-60">Tap Screen</span>
    </button>
  </div>

  <!-- Bottom Tip -->
  <footer class="py-2 text-center">
    <p class="text-[11px] text-zinc-500 font-medium max-w-xs leading-relaxed">
      Watch the main screen and jump exactly when the obstacle crosses your avatar's target line!
    </p>
  </footer>
</div>

<style>
  .gameplay-container {
    height: 100%;
    background: radial-gradient(circle at center, #130a24 0%, #06050a 100%);
    box-sizing: border-box;
  }

  .jump-button-giant {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: none;
    outline: none;
    background: radial-gradient(circle, #8b5cf6 0%, #6d28d9 100%);
    box-shadow: 
      0 0 30px rgba(139, 92, 246, 0.4),
      inset 0 4px 10px rgba(255, 255, 255, 0.3),
      inset 0 -4px 10px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
  }

  .jump-button-giant.pressed {
    transform: scale(0.92);
    box-shadow: 
      0 0 15px rgba(139, 92, 246, 0.6),
      inset 0 2px 5px rgba(0,0,0,0.5);
    background: radial-gradient(circle, #a78bfa 0%, #5b21b6 100%);
  }

  .glow-ring {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 2px dashed rgba(167, 139, 250, 0.3);
    animation: rotate 15s linear infinite;
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .jump-text {
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    color: white;
  }

  /* Score pop bubble */
  .score-pop {
    animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes popUp {
    0% {
      opacity: 0;
      transform: translateY(10px) scale(0.5);
    }
    50% {
      opacity: 1;
      transform: translateY(-10px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translateY(-25px) scale(0.8);
    }
  }
</style>
