<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined } from "m3-svelte";

  let m_data = get(gameState).page_data;
  let caption_text = "";

  function submit_caption() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: caption_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4 py-6"
>
  <div class="subtitle-text">What is this drawing?</div>

  {#if m_data && m_data.image}
    <div class="img-container mb-6 max-w-xs w-full aspect-square border-4 border-stone-800 rounded-2xl overflow-hidden shadow-lg bg-white p-2">
      <img src={m_data.image} alt="Mystery AI Drawing" class="w-full h-full object-contain rounded-lg" />
    </div>
  {:else}
    <div class="img-container mb-6 max-w-xs w-full aspect-square border-4 border-dashed border-stone-400 rounded-2xl flex items-center justify-center bg-stone-100 text-4xl">
      🎨
    </div>
  {/if}

  <form class="flex flex-col justify-center items-center w-full max-w-md gap-4" on:submit|preventDefault={submit_caption}>
    <div class="field-wrapper w-full">
      <TextFieldOutlined
        label="Write your caption..."
        type="text"
        maxlength={80}
        bind:value={caption_text}
      />
    </div>
    <GameSubmit onSubmit={submit_caption} />
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font); font-size: 1.25rem; line-height: 1.5; font-weight: 700;
    color: var(--m3c-on-background);
    margin-bottom: 1rem;
    text-align: center;
  }

  .img-container {
    box-sizing: border-box;
  }

  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }
</style>
