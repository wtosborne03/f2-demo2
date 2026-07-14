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

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <!-- Header Section -->
  <div class="mb-8 w-full">
    <h2 class="text-3xl font-black mb-2 tracking-tight">
      Pick Your Photo
    </h2>
    <p class="text-base-content/70 text-sm leading-relaxed">
      Choose the one that represents you best!
    </p>
  </div>

  <!-- Carousel Section -->
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full flex flex-col items-center">
    <div class="flex flex-row w-full justify-between items-center mb-8 gap-4">
      <button
        type="button"
        class="disabled:opacity-10 disabled:grayscale text-base-content/60 hover:text-primary transition-colors"
        disabled={s_data?.photo_index === 0}
        onclick={carouselLeft}
      >
        <Icon icon="icon-park-solid:left-c" class="text-5xl md:text-6xl" />
      </button>

      <div class="flex flex-col items-center flex-1">
        <span class="text-6xl font-black tabular-nums tracking-tighter text-primary">
          {s_data?.photo_index + 1}
        </span>
      </div>

      <button
        type="button"
        class="disabled:opacity-10 disabled:grayscale text-base-content/60 hover:text-primary transition-colors"
        disabled={s_data?.photo_index === s_data?.photo_amount - 1}
        onclick={carouselRight}
      >
        <Icon icon="icon-park-solid:right-c" class="text-5xl md:text-6xl" />
      </button>
    </div>

    <!-- Step Indicator -->
    <div class="flex gap-2 justify-center w-full">
      {#if s_data?.photo_amount}
        {#each Array(s_data.photo_amount) as _, i}
          <div
            class="h-2 rounded-full transition-all duration-300 {i === s_data?.photo_index
              ? 'bg-primary w-8'
              : 'bg-base-content/20 w-2'}"
          />
        {/each}
      {/if}
    </div>
  </div>

  <!-- Action Section -->
  <div class="w-full mt-8">
    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-2"
      onclick={submit_answer}
    >
      <span>VOTE</span>
      <Icon
        icon="fa7-solid:vote-yea"
        class="text-xl"
      />
    </button>
  </div>
</div>
