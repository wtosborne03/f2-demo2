<script lang="ts">
  import { get } from "svelte/store";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

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

<div class="flex flex-col items-center justify-between h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="w-full flex-grow flex flex-col items-center justify-center">
    <div class="mb-4 w-full">
      <h2 class="text-3xl font-extrabold mb-2 tracking-tight">
        Remix a Photo!
      </h2>
      <p class="text-base-content/70 text-sm leading-relaxed">
        Select a player's photo and write an AI prompt to edit it!
      </p>
    </div>

    {#if items.length > 0}
      <div class="w-full flex flex-col items-center">
        <PhotoCarousel
          wrap={false}
          {items}
          height="30vh"
          bind:currentIndex={p_index}
        />
        <div class="text-xs text-base-content/60 mt-2 mb-6">
          Photo by: <span class="text-primary font-bold">{items[p_index]?.id}</span>
        </div>
      </div>
    {:else}
      <div class="text-base-content/40 italic my-8">No photos available.</div>
    {/if}

    <form class="w-full mt-2" onsubmit={(e) => { e.preventDefault(); submit_choice_and_prompt(); }}>
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text font-bold text-sm text-base-content/85">
            AI Prompt (e.g. 'as a cyberpunk warrior')
          </span>
        </div>
        <input
          type="text"
          class="input input-bordered input-lg w-full font-semibold"
          maxlength={128}
          placeholder="Type how you want to remix this photo..."
          bind:value={promptText}
        />
        <div class="label py-1 justify-end">
          <span class="label-text-alt text-xs text-base-content/50">
            {promptText.length} / 128
          </span>
        </div>
      </label>
    </form>
  </div>

  <div class="w-full mt-6">
    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-2"
      onclick={submit_choice_and_prompt}
      disabled={loading || items.length === 0 || !promptText.trim()}
    >
      {#if loading}
        <span class="loading loading-spinner"></span>
        Generating Remix...
      {:else}
        <span>Submit Remix</span>
        <Icon
          class="text-xl"
          icon="material-symbols:edit-square-outline"
        />
      {/if}
    </button>
  </div>
</div>
