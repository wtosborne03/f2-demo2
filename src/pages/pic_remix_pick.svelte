<script lang="ts">
  import { get } from "svelte/store";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button, TextFieldOutlined } from "m3-svelte";

  let s_data: any;
  s_data = get(gameState).page_data;

  let p_index = 0;
  let promptText = "";

  $: items = Object.entries(s_data?.photos || {}).map(([id, src]) => ({
    id,
    src: String(src),
  }));

  let loading = false;

  function submit_choice_and_prompt() {
    if (items.length === 0) return;
    loading = true;
    const chosenPlayerName = items[p_index]?.id || "";
    gameClient.sendInput({
      type: "votePhotoData",
      votePhotoData: {
        photoIndex: chosenPlayerName,
      },
      answer: promptText,
    });
  }
</script>

<div class="h-full flex flex-col items-center text-center px-4 w-full justify-between py-6">
  <div class="w-full flex-1 flex flex-col items-center justify-center">
    <div class="text-center mb-4 max-w-sm">
      <h2 class="text-3xl font-extrabold text-white tracking-tight mb-1">
        Remix a Photo!
      </h2>
      <p class="text-zinc-400 text-base leading-snug">
        Select a player's photo and write an AI prompt to edit it!
      </p>
    </div>

    {#if items.length > 0}
      <PhotoCarousel
        wrap={false}
        {items}
        height="35vh"
        bind:currentIndex={p_index}
      />
      <div class="text-sm text-zinc-400 mt-1 mb-4">
        Photo by: <span class="text-indigo-400 font-bold">{items[p_index]?.id}</span>
      </div>
    {:else}
      <div class="text-zinc-500 italic my-6">No photos available.</div>
    {/if}

    <form class="w-full max-w-md mt-2 flex flex-col gap-4" on:submit|preventDefault={submit_choice_and_prompt}>
      <div class="field-wrapper w-full">
        <TextFieldOutlined
          label="AI Prompt (e.g. 'as a cyberpunk warrior')"
          type="text"
          maxlength={128}
          placeholder="Type how you want to remix this photo..."
          bind:value={promptText}
        />
        <div class="text-right text-xs text-stone-400 mt-1">
          {promptText.length} / 128
        </div>
      </div>
    </form>
  </div>

  <div class="w-full flex justify-center pb-2 mt-4 btn-wrapper">
    <Button
      variant="filled"
      size="l"
      onclick={submit_choice_and_prompt}
      disabled={loading || items.length === 0 || !promptText.trim()}
    >
      {#if loading}
        Generating Remix...
      {:else}
        Submit Remix
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
  .field-wrapper {
    width: 100%;
  }
  .field-wrapper > :global(*) {
    width: 100%;
  }
</style>
