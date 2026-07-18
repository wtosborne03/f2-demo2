<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { fade, fly } from "svelte/transition";
  import { spring } from "svelte/motion";
  import Icon from "@iconify/svelte";

  interface GameData {
    name: string;
    fullName: string;
    description: string;
    boxImage: string;
  }

  let m_data = get(gameState).page_data as {
    games: GameData[];
    lastGame?: GameData | null;
  };

  let games = m_data?.games || [];
  let lastGame = m_data?.lastGame || null;

  let activeIndex = games.length >= 3 ? 1 : 0; // Default to middle card if 3 choices

  // Spring store for physical carousel movement
  const offset = spring(activeIndex, {
    stiffness: 0.08,
    damping: 0.55,
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
  class=" h-[calc(100dvh-5.5rem)] flex flex-col justify-center items-center w-screen select-none font-sans text-neutral-50 dark:text-white"
>
  <div class="flex flex-col items-center w-full justify-center mt-2 px-4">
    {#if lastGame}
      <!-- Replay Last Game Box/Button -->
      <button
        type="button"
        class="btn btn-secondary btn-xl w-full max-w-[35rem] font-bold text-base tracking-wider uppercase"
        disabled={hasVoted}
        onclick={() => submit_answer("replay_game")}
      >
        <Icon
          icon="mdi:replay"
          class="text-2xl animate-[spin_4s_linear_infinite] [animation-direction:reverse]"
        />
        Replay {lastGame.fullName}
      </button>
    {/if}
  </div>
  {#if games.length > 0}
    <div
      class="carousel-wrapper box-border flex w-full flex-col items-center justify-between px-4 bg-accent/40 rounded-3xl mt-4 max-w-[35rem] overflow-hidden border-accent border-4"
      in:fade={{ duration: 400 }}
    >
      <!-- 3D Carousel Swiper viewport -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="carousel-container relative flex h-[45vh] mt-6 md:mt-8 w-full items-center justify-center [perspective:1000px] [transform-style:preserve-3d] cursor-grab active:cursor-grabbing touch-none"
        onmousedown={handleDragStart}
        onmousemove={handleDragMove}
        onmouseup={handleDragEnd}
        onmouseleave={handleDragEnd}
        ontouchstart={handleDragStart}
        ontouchmove={handleDragMove}
        ontouchend={handleDragEnd}
        ontouchcancel={handleDragEnd}
      >
        <!-- Stack of cards using 3D transforms based on spring offset -->
        {#each games as game, i}
          {@const diff = i - $offset}
          {@const absDiff = Math.abs(diff)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="carousel-card absolute top-1/2 left-1/2 h-[45vh] aspect-57/74 transform-3d overflow-hidden rounded-[1.25rem] border-[3px] border-white/10 bg-neutral-900 shadow-xl transition-[border-color,box-shadow] duration-300 will-change-transform {activeIndex ===
            i
              ? 'border-primary shadow-primary/30 shadow-2xl'
              : ''}"
            style="
              transform: translate(-50%, -50%) translateX(calc({diff} * var(--spacing-36))) translateZ(calc({-absDiff} * var(--spacing-40))) rotateY({diff *
              -26}deg);
              z-index: {Math.round(10 - absDiff)};
              opacity: {Math.max(0, 1 - absDiff * 0.55)};
            "
            onclick={() => {
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
      <div
        class=" z-10 mb-1 flex w-full max-w-[32rem] mt-4 items-center justify-between gap-1"
      >
        <button
          class="icon-nav-btn flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-white shadow-md backdrop-blur-sm transition-all hover:bg-white/25 active:scale-90 disabled:pointer-events-none disabled:opacity-20"
          disabled={activeIndex === 0}
          onclick={prevCard}
        >
          <Icon icon="mdi:chevron-left" width="2.25rem" height="2.25rem" />
        </button>
        <div
          class="grid flex-1 grid-cols-1 grid-rows-1 items-center justify-items-center min-w-0 h-24"
        >
          {#key activeIndex}
            <div
              class="col-start-1 row-start-1 text-center"
              in:fly={{ y: 8, duration: 300, delay: 50 }}
              out:fade={{ duration: 150 }}
            >
              <p
                class="game-info-desc m-0 text-md md:text-xl leading-relaxed text-white font-medium"
              >
                {games[activeIndex]?.description}
              </p>
            </div>
          {/key}
        </div>
        <button
          class="icon-nav-btn flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-white shadow-md backdrop-blur-sm transition-all hover:bg-white/25 active:scale-90 disabled:pointer-events-none disabled:opacity-20"
          disabled={activeIndex === games.length - 1}
          onclick={nextCard}
        >
          <Icon icon="mdi:chevron-right" width="2.25rem" height="2.25rem" />
        </button>
      </div>

      <!-- Pick Button -->
      <button
        type="button"
        class="btn btn-primary btn-xl w-full max-w-[32rem] mt-auto mb-5 font-bold text-base tracking-wider uppercase"
        disabled={hasVoted}
        onclick={() => submit_answer(games[activeIndex].name)}
      >
        {#if hasVoted}
          <span class="loading loading-spinner"></span>
          SUBMITTING...
        {:else}
          <Icon icon="mdi:vote" class="text-2xl" />
          VOTE {games[activeIndex]?.fullName.toUpperCase()}
        {/if}
      </button>
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
