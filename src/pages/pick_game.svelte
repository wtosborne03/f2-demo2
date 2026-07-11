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
    stiffness: 0.08,
    damping: 0.45,
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
  let currentX = 0;
  let startOffset = activeIndex;
  let dragStartTime = 0;

  function handleDragStart(e: MouseEvent | TouchEvent) {
    isDragging = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    currentX = clientX;
    startOffset = activeIndex;
    dragStartTime = Date.now();
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    currentX = clientX;
    const dx = clientX - startX;
    // Spacing of slides in relative mapping (approx 160px drag = 1 slide)
    const offsetShift = dx / 160;
    let targetVal = startOffset - offsetShift;

    // Add rubber band resistance at bounds
    if (targetVal < 0) {
      targetVal = targetVal * 0.35;
    } else if (targetVal > games.length - 1) {
      const maxIdx = games.length - 1;
      targetVal = maxIdx + (targetVal - maxIdx) * 0.35;
    }

    offset.set(targetVal, { hard: true });
  }

  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    const dx = currentX - startX;
    const dt = Date.now() - dragStartTime;

    let targetIndex = activeIndex;

    // 1. Velocity/Flick detection
    if (dt < 250 && Math.abs(dx) > 30) {
      if (dx > 0) {
        targetIndex = Math.max(0, activeIndex - 1);
      } else {
        targetIndex = Math.min(games.length - 1, activeIndex + 1);
      }
    } else {
      // 2. Normal drag snap: Use the current spring position to determine closest card
      targetIndex = Math.round($offset);
      targetIndex = Math.max(0, Math.min(games.length - 1, targetIndex));
    }

    // 3. Only update if the index actually changed, avoiding resetting the spring physics mid-flight
    if (activeIndex !== targetIndex) {
      activeIndex = targetIndex;
    } else {
      // If we didn't cross the threshold, smoothly snap back to the original active index
      offset.set(activeIndex);
    }
  }
</script>

<div
  class="pick-scene-root relative h-screen w-screen overflow-hidden select-none font-sans text-neutral-50 dark:text-white"
>
  {#if games.length > 0}
    <div
      class="carousel-wrapper box-border flex h-full w-full flex-col items-center justify-between px-4 pt-9 pb-11"
      in:fade={{ duration: 400 }}
    >
      <!-- 3D Carousel Swiper viewport -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="carousel-container relative my-2 flex h-[65vh] w-full items-center justify-center [perspective:1000px] [transform-style:preserve-3d] cursor-grab active:cursor-grabbing"
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
            class="carousel-card absolute h-[45vh] aspect-57/74 transform-3d overflow-hidden rounded-[1.25rem] border-[3px] border-white/10 bg-neutral-900 shadow-xl transition-[border-color,box-shadow] duration-300 will-change-transform {activeIndex ===
            i
              ? 'border-primary shadow-primary/30 shadow-2xl'
              : ''}"
            style="
              transform: translateX(calc({diff} * var(--spacing-36))) translateZ(calc({-absDiff} * var(--spacing-40))) rotateY({diff *
              -26}deg);
              z-index: {Math.round(100 - absDiff * 10)};
              opacity: {Math.max(0, 1 - absDiff * 0.55)};
            "
            on:click={() => {
              if (!isDragging) activeIndex = i;
            }}
          >
            <div class="card-boxart-frame relative h-full w-full">
              <img
                src="{import.meta.env
                  .VITE_PUBLIC_API_URL}/static/boxArt/{game.boxImage}"
                alt={game.fullName}
                class="card-boxart-image pointer-events-none h-full w-full object-cover"
              />
              <div
                class="card-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
              ></div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Bottom Controls row -->
      <div class="navigation-controls z-10 mb-1 flex items-center gap-4">
        <button
          class="icon-nav-btn flex items-center justify-center rounded-full bg-transparent p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent"
          disabled={activeIndex === 0}
          on:click={prevCard}
        >
          <Icon icon="mdi:chevron-left" width="1.5rem" height="1.5rem" />
        </button>
        <div class="dot-indicators flex gap-2">
          {#each games as _, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="dot h-2 w-2 cursor-pointer rounded-full bg-white/20 transition-[background-color,transform] duration-300"
              class:bg-primary={activeIndex === i}
              class:scale-125={activeIndex === i}
              on:click={() => (activeIndex = i)}
            ></div>
          {/each}
        </div>
        <button
          class="icon-nav-btn flex items-center justify-center rounded-full bg-transparent p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent"
          disabled={activeIndex === games.length - 1}
          on:click={nextCard}
        >
          <Icon icon="mdi:chevron-right" width="1.5rem" height="1.5rem" />
        </button>
      </div>

      <!-- Info Details Panel -->
      <div
        class="game-info-panel z-10 mb-1 flex h-22 w-full max-w-[18.75rem] flex-col justify-center text-center"
      >
        {#key activeIndex}
          <div
            in:fly={{ y: 8, duration: 300, delay: 50 }}
            out:fade={{ duration: 150 }}
          >
            <h2
              class="game-info-title mt-0 mb-1.5 text-2xl font-black uppercase tracking-wide text-white drop-shadow-md"
            >
              {games[activeIndex]?.fullName}
            </h2>
            <p
              class="game-info-desc m-0 text-[0.8125rem] leading-relaxed text-white"
            >
              {games[activeIndex]?.description}
            </p>
          </div>
        {/key}
      </div>

      <!-- Pick Button -->
      <div
        class="btn-wrapper z-10 flex w-full justify-center [&>*]:h-13 [&>*]:w-full [&>*]:max-w-[17.5rem] [&>*]:text-base [&>*]:font-bold [&>*]:tracking-wider [&>*]:uppercase"
      >
        <Button
          variant="filled"
          size="l"
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
    <div class="flex h-full w-full items-center justify-center bg-neutral-950">
      <p class="animate-pulse font-mono text-sm text-neutral-500">
        Awaiting minigame choices...
      </p>
    </div>
  {/if}
</div>

<style>
  .carousel-container {
    --spacing-36: min(52vw, 13rem);
    --spacing-40: min(30vw, 10rem);
  }
  .carousel-card {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
</style>
