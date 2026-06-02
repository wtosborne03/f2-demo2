<script lang="ts">
  import { get } from "svelte/store";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  let s_data: any;
  s_data = get(gameState).page_data;

  let p_index = 0;

  $: items = Object.entries(s_data?.photos || {}).map(([id, src]) => ({
    id,
    src: String(src),
  }));

  let loading = false;

  function submit_choice() {
    if (items.length === 0) return;
    loading = true;
    const chosenPlayerName = items[p_index]?.id || "";
    gameClient.sendInput({
      type: "votePhotoData",
      votePhotoData: {
        photoIndex: chosenPlayerName,
      },
    });
  }
</script>

<div class="h-full flex flex-col items-center text-2xl text-center px-4 w-full">
  <div class="w-full flex-1 flex flex-col items-center justify-center">
    <div class="text-center mb-6 max-w-sm">
      <h2 class="text-3xl font-extrabold text-white tracking-tight mb-2">
        Choose a Photo
      </h2>
      <p class="text-zinc-400 text-lg leading-snug">
        Select which player's photo you want to remix!
      </p>
    </div>

    {#if items.length > 0}
      <PhotoCarousel
        wrap={false}
        {items}
        height="50vh"
        bind:currentIndex={p_index}
      />
      <div class="text-sm text-zinc-400 mt-2">
        Photo by: <span class="text-indigo-400 font-bold">{items[p_index]?.id}</span>
      </div>
    {:else}
      <div class="text-zinc-500 italic my-10">No photos available.</div>
    {/if}
  </div>

  <div class="w-full flex justify-center pb-6 mt-6 btn-wrapper">
    <Button variant="filled" size="l" onclick={submit_choice} disabled={loading || items.length === 0}>
      {#if loading}
        Sending...
      {:else}
        Select Photo
        <Icon
          style="font-size: 1.5rem; margin-left: 0.5rem;"
          icon="material-symbols:edit-square-outline"
        />
      {/if}
    </Button>
  </div>
</div>

<style>
  .btn-wrapper > :global(*) {
    padding: 1.5rem 3rem;
    font-size: 1.25rem;
    font-weight: bold;
    border-radius: var(--m3-shape-large);
  }
</style>
