<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";

  export let items: Array<{ id: string; src: string }> = [];
  export let height = "60vh";
  export let autoplay = 0; // milliseconds, 0 = disabled
  // whether the carousel should wrap from last->first and first->last
  export let wrap = true;
  export let currentIndex = 0;

  const dispatch = createEventDispatcher();
  let track: HTMLDivElement | null = null;
  let intervalId: number | null = null;

  // update transform when index changes
  $: if (track) {
    track.style.transform = `translateX(${-currentIndex * 100}%)`;
  }

  $: dispatch("change", { index: currentIndex });

  function prev() {
    if (!items || items.length === 0) return;
    if (wrap) {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    } else {
      if (currentIndex > 0) currentIndex = currentIndex - 1;
    }
  }

  function next() {
    if (!items || items.length === 0) return;
    if (wrap) {
      currentIndex = (currentIndex + 1) % items.length;
    } else {
      if (currentIndex < items.length - 1) currentIndex = currentIndex + 1;
    }
  }

  onMount(() => {
    if (autoplay > 0 && items && items.length > 1) {
      intervalId = window.setInterval(() => {
        // if not wrapping and we've reached the end, stop autoplay
        if (!wrap && currentIndex === items.length - 1) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }
        next();
      }, autoplay);
    }

    // global keyboard handler so we don't need to make a div focusable
    window.addEventListener("keydown", handleKey);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("keydown", handleKey);
    };
  });

  // basic pointer drag support
  // (Swipe/drag handlers removed — carousel uses buttons and keyboard only)

  // keyboard left/right
  function handleKey(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  }
</script>

<div
  class="carousel-viewport"
  style:height
  role="region"
  aria-label="Photo carousel"
  aria-roledescription="carousel"
>
  <div class="carousel-track" bind:this={track} role="list">
    {#each items as item (item.id)}
      <div class="carousel-slide my-auto" role="listitem">
        <img
          src={item.src}
          alt=""
          style="max-width:100%; max-height:100%; width:auto; height:auto; object-fit:contain;"
        />
      </div>
    {/each}
  </div>

  {#if items && items.length > 0}
    <div class="controls" aria-hidden="false">
      <button
        class="nav-btn hover:scale-105"
        on:click={prev}
        aria-label="Previous">❮</button
      >
      <button class="nav-btn hover:scale-105" on:click={next} aria-label="Next"
        >❯</button
      >
    </div>
  {/if}
</div>

{#if items && items.length > 1}
  <div class="dots">
    {#each items as _, i}
      <button
        class="dot {i === currentIndex ? 'active' : ''}"
        on:click={() => (currentIndex = i)}
        aria-label={"Go to slide " + (i + 1)}
      ></button>
    {/each}
  </div>
{/if}

<style>
  .carousel-viewport {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
  }
  .carousel-track {
    display: flex;
    width: 100%;
    transition: transform 300ms ease;
  }
  .carousel-slide {
    min-width: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .controls {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    padding: 0 0.5rem;
    pointer-events: none;
  }
  .nav-btn {
    pointer-events: auto;
    background: rgba(0, 0, 0, 0.45);
    color: white;
    border-radius: 999px;
    padding: 0.35rem 0.6rem;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .dots {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.5rem;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.18);
    border: none;
  }
  .dot.active {
    background: rgba(0, 0, 0, 0.75);
  }
</style>
