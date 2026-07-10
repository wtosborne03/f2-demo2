<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { fade, fly } from "svelte/transition";
  import { spring } from "svelte/motion";

  interface GameData {
    name: string;
    fullName: string;
    description: string;
    boxImage: string;
  }

  let m_data = get(gameState).page_data as { games: GameData[] };
  let games = m_data?.games || [];

  let activeIndex = games.length >= 3 ? 1 : 0; // Default to middle card if 3 choices
  
  // Spring store for physical carousel movement
  const offset = spring(activeIndex, {
    stiffness: 0.12,
    damping: 0.58
  });

  // Update spring target when activeIndex changes
  $: offset.set(activeIndex);

  let hasVoted = false;

  function submit_answer(gameName: string) {
    if (hasVoted) return;
    hasVoted = true;
    gameClient.sendInput({
      type: "game_choice",
      game: gameName,
    });
  }



  function nextCard() {
    if (activeIndex < games.length - 1) {
      activeIndex++;
    }
  }

  function prevCard() {
    if (activeIndex > 0) {
      activeIndex--;
    }
  }
</script>

<div class="pick-scene-root select-none">
  {#if games.length > 0}
    <div class="carousel-wrapper" in:fade={{ duration: 400 }}>
      <!-- Header Area -->
      <div class="header-area">
        <h1 class="header-title">Vote Next Game</h1>
      </div>

      <!-- 3D Carousel Swiper viewport -->
      <div class="carousel-container">
        <!-- Prev Arrow -->
        {#if activeIndex > 0}
          <button class="nav-btn prev" on:click={prevCard}>
            &larr;
          </button>
        {/if}

        <!-- Next Arrow -->
        {#if activeIndex < games.length - 1}
          <button class="nav-btn next" on:click={nextCard}>
            &rarr;
          </button>
        {/if}

        <!-- Stack of cards using 3D transforms based on spring offset -->
        {#each games as game, i}
          {@const diff = i - $offset}
          {@const absDiff = Math.abs(diff)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="carousel-card {activeIndex === i ? 'active-card' : ''}"
            style="
              transform: translateX({diff * 136}px) translateZ({-absDiff * 140}px) rotateY({diff * -26}deg);
              z-index: {Math.round(100 - absDiff * 10)};
              opacity: {Math.max(0, 1 - absDiff * 0.55)};
            "
            on:click={() => activeIndex = i}
          >
            <div class="card-boxart-frame">
              <img
                src="/static/boxArt/{game.boxImage}"
                alt={game.fullName}
                class="card-boxart-image"
              />
              <div class="card-overlay"></div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Dot Indicators -->
      <div class="dot-indicators">
        {#each games as _, i}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="dot {activeIndex === i ? 'active' : ''}"
            on:click={() => activeIndex = i}
          ></div>
        {/each}
      </div>

      <!-- Info Details Panel -->
      <div class="game-info-panel">
        {#key activeIndex}
          <div in:fly={{ y: 8, duration: 300, delay: 50 }} out:fade={{ duration: 150 }}>
            <h2 class="game-info-title">{games[activeIndex]?.fullName}</h2>
            <p class="game-info-desc">{games[activeIndex]?.description}</p>
          </div>
        {/key}
      </div>

      <!-- Pick Button -->
      <button
        class="pick-button"
        disabled={hasVoted}
        on:click={() => submit_answer(games[activeIndex].name)}
      >
        {#if hasVoted}
          SUBMITTING...
        {:else}
          VOTE THIS GAME
        {/if}
      </button>
    </div>
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-zinc-950">
      <p class="animate-pulse font-mono text-sm text-zinc-500">
        Awaiting minigame choices...
      </p>
    </div>
  {/if}
</div>

<style>
  .pick-scene-root {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at center, #1b1b22 0%, #08080a 100%);
    overflow: hidden;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .carousel-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    padding: 36px 16px 44px;
    box-sizing: border-box;
  }

  .header-area {
    text-align: center;
    margin-bottom: 8px;
  }

  .header-title {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #94a3b8;
    margin: 0;
  }

  .carousel-container {
    position: relative;
    width: 100%;
    height: 310px;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1000px;
    transform-style: preserve-3d;
    margin: 12px 0;
  }

  .carousel-card {
    position: absolute;
    width: 175px;
    height: 262px;
    border-radius: 20px;
    overflow: hidden;
    background-color: #111115;
    border: 3px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    will-change: transform, opacity, z-index;
    transition: border-color 0.3s, box-shadow 0.3s;
    transform-style: preserve-3d;
  }

  .carousel-card.active-card {
    border-color: #ffaa00;
    box-shadow: 
      0 0 25px rgba(255, 170, 0, 0.45),
      0 20px 45px rgba(0, 0, 0, 0.7);
  }

  .card-boxart-frame {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .card-boxart-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }

  .card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.45) 0%, transparent 50%);
    pointer-events: none;
  }

  /* Navigation arrows */
  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.8);
    font-size: 16px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 150;
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
  }

  .nav-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  .nav-btn.prev {
    left: 4px;
  }

  .nav-btn.next {
    right: 4px;
  }

  /* Dot indicators */
  .dot-indicators {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    z-index: 10;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
  }

  .dot.active {
    background-color: #ffaa00;
    transform: scale(1.3);
  }

  /* Game Info Panel */
  .game-info-panel {
    text-align: center;
    width: 100%;
    max-width: 300px;
    height: 88px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin-bottom: 16px;
    z-index: 10;
  }

  .game-info-title {
    font-size: 24px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 6px;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .game-info-desc {
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.45;
    margin: 0;
  }

  /* Pick Button */
  .pick-button {
    width: 100%;
    max-width: 280px;
    height: 52px;
    border-radius: 16px;
    background: linear-gradient(135deg, #ffaa00 0%, #ff7700 100%);
    border: none;
    color: black;
    font-size: 15px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(255, 119, 0, 0.35);
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
    will-change: transform;
    z-index: 10;
  }

  .pick-button:active {
    transform: scale(0.96);
    box-shadow: 0 4px 10px rgba(255, 119, 0, 0.2);
  }

  .pick-button:disabled {
    background: #27272a;
    color: #52525b;
    box-shadow: none;
    cursor: not-allowed;
  }
</style>
