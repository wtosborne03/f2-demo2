<script lang="ts">
  import { get } from "svelte/store";
  import type { photoPickerData } from "../types/page_data";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";

  let s_data: photoPickerData;
  s_data = get(gameState).page_data;

  $: s_data, gameClient.sendPlayerInput("photo_picker", { data: s_data });

  function carouselLeft() {
    s_data.photo_index -= 1;
  }
  function carouselRight() {
    s_data.photo_index += 1;
  }
  function submit_answer() {
    gameClient.sendPlayerInput("vote", { data: s_data });
  }
</script>

<div
  class="container h-full mx-auto flex flex-col justify-center items-center p-6 overflow-hidden"
>
  <!-- Header Section -->
  <div class="text-center mb-10 max-w-sm">
    <h2 class="text-3xl font-extrabold text-white tracking-tight mb-2">
      Pick Your Photo
    </h2>
    <p class="text-zinc-400 text-lg leading-snug">
      Choose the one that represents you best!
    </p>
  </div>

  <!-- Carousel Section -->
  <div
    class="w-full max-w-md bg-zinc-900/30 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center"
  >
    <div class="flex flex-row w-full justify-between items-center mb-8 gap-4">
      <button
        type="button"
        class="transition-all active:scale-90 disabled:opacity-10 disabled:grayscale hover:text-indigo-400 text-zinc-400"
        disabled={s_data?.photo_index === 0}
        on:click={carouselLeft}
      >
        <Icon icon="icon-park-solid:left-c" width="85" height="85" />
      </button>

      <div class="flex flex-col items-center flex-1">
        <span
          class="text-6xl font-black text-white tabular-nums tracking-tighter"
        >
          {s_data?.photo_index + 1}
        </span>
      </div>

      <button
        type="button"
        class="transition-all active:scale-90 disabled:opacity-10 disabled:grayscale hover:text-indigo-400 text-zinc-400"
        disabled={s_data?.photo_index === s_data?.photo_amount - 1}
        on:click={carouselRight}
      >
        <Icon icon="icon-park-solid:right-c" width="85" height="85" />
      </button>
    </div>

    <!-- Step Indicator -->
    <div class="flex gap-2.5">
      {#if s_data?.photo_amount}
        {#each Array(s_data.photo_amount) as _, i}
          <div
            class="h-3.5 rounded-full transition-all duration-500 {i ===
            s_data?.photo_index
              ? 'bg-blue-500 w-15 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
              : 'bg-zinc-600 w-10'}"
          />
        {/each}
      {/if}
    </div>
  </div>

  <!-- Action Section -->
  <div class="w-full flex justify-center mt-12 pb-4">
    <button
      type="button"
      class="btn bg-indigo-600 hover:bg-indigo-500 text-white text-2xl px-12 py-5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-4 group"
      on:click={submit_answer}
      aria-label="Vote for selected photo"
    >
      <span>VOTE</span>
      <Icon
        icon="fa7-solid:vote-yea"
        class="text-3xl group-hover:scale-110 transition-transform"
      />
    </button>
  </div>
</div>
