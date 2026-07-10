<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { fade, fly } from "svelte/transition";
  import { spring } from "svelte/motion";
  import { Button } from "m3-svelte";
  import Icon from "@iconify/svelte";

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

  // Swipe / Drag controls
  let isDragging = false;
  let startX = 0;
  let startOffset = activeIndex;

  function handleDragStart(e: MouseEvent | TouchEvent) {
    isDragging = true;
    startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startOffset = activeIndex;
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dx = clientX - startX;
    // Spacing of slides in pixel value relative mapping (approx 160px drag = 1 slide)
    const offsetShift = dx / 160;
    offset.set(startOffset - offsetShift, { hard: false });
  }

  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    // Snap to the closest integer index
    let currentVal = $offset;
    let targetIndex = Math.round(currentVal);
    
    // Clamp targetIndex between bounds
    targetIndex = Math.max(0, Math.min(games.length - 1, targetIndex));
    activeIndex = targetIndex;
    offset.set(activeIndex);
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
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div 
        class="carousel-container"
        on:mousedown={handleDragStart}
        on:mousemove={handleDragMove}
        on:mouseup={handleDragEnd}
        on:mouseleave={handleDragEnd}
        on:touchstart|passive={handleDragStart}
        on:touchmove|passive={handleDragMove}
        on:touchend={handleDragEnd}
        on:touchcancel={handleDragEnd}
      >
        <!-- Stack of cards using 3D transforms based on spring offset -->
        {#each games as game, i}
          {@const diff = i - $offset}
          {@const absDiff = Math.abs(diff)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="carousel-card {activeIndex === i ? 'active-card' : ''}"
            style="
              transform: translateX({diff * 144}px) translateZ({-absDiff * 160}px) rotateY({diff * -26}deg);
              z-index: {Math.round(100 - absDiff * 10)};
              opacity: {Math.max(0, 1 - absDiff * 0.55)};
            "
            on:click={() => { if (!isDragging) activeIndex = i; }}
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

      <!-- Bottom Controls row (Fallback navigation next to dot indicators) -->
      <div class="navigation-controls">
        <button class="icon-nav-btn" disabled={activeIndex === 0} on:click={prevCard}>
          <Icon icon="mdi:chevron-left" width="24" height="24" />
        </button>
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
        <button class="icon-nav-btn" disabled={activeIndex === games.length - 1} on:click={nextCard}>
          <Icon icon="mdi:chevron-right" width="24" height="24" />
        </button>
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

      <!-- Pick Button (Material 3 Button) -->
      <div class="btn-wrapper">
        <Button
          variant="filled"
          disabled={hasVoted}
          onclick={() => submit_answer(games[activeIndex].name)}
        >
          {#if hasVoted}
            SUBMITTING...
          {:else}
            VOTE THIS GAME
          {/if}
        </Button>
      </div>
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
    height: 360px;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1000px;
    transform-style: preserve-3d;
    margin: 12px 0;
    cursor: grab;
  }

  .carousel-container:active {
    cursor: grabbing;
  }

  .carousel-card {
    position: absolute;
    width: 210px;
    height: 315px;
    border-radius: 20px;
    overflow: hidden;
    background-color: #111115;
    border: 3px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6);
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

  /* Navigation & dots */
  .navigation-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    z-index: 10;
  }

  .icon-nav-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-radius: 50%;
    transition: color 0.2s, background-color 0.2s;
  }

  .icon-nav-btn:hover:not(:disabled) {
    color: white;
    background-color: rgba(255, 255, 255, 0.06);
  }

  .icon-nav-btn:disabled {
    color: #4b5563;
    cursor: not-allowed;
  }

  .dot-indicators {
    display: flex;
    gap: 8px;
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

  /* Button Wrapper for Material 3 Button styling overrides */
  .btn-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    z-index: 10;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
    max-width: 280px;
    height: 52px;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
</style>
