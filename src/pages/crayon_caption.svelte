<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data = get(gameState).page_data;
  let caption_text = "";

  function submit_caption() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: caption_text,
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="text-xl font-bold mb-4">What is this drawing?</div>

  {#if m_data && m_data.image}
    <div class="mb-6 w-full max-w-xs aspect-square border-4 border-base-content/20 rounded-2xl overflow-hidden shadow-lg bg-white p-2">
      <img src={m_data.image} alt="Mystery AI Drawing" class="w-full h-full object-contain rounded-lg" />
    </div>
  {:else}
    <div class="mb-6 w-full max-w-xs aspect-square border-4 border-dashed border-base-content/20 rounded-2xl flex items-center justify-center bg-base-200 text-4xl">
      🎨
    </div>
  {/if}

  <form class="flex flex-col items-center w-full gap-4" onsubmit={(e) => { e.preventDefault(); submit_caption(); }}>
    <label class="form-control w-full">
      <div class="label py-1">
        <span class="label-text font-bold text-sm text-base-content/85">Write your caption...</span>
      </div>
      <input
        type="text"
        class="input input-bordered input-lg w-full font-semibold"
        maxlength={80}
        placeholder="Type a guess or caption..."
        bind:value={caption_text}
      />
    </label>
    <GameSubmit onSubmit={submit_caption} />
  </form>
</div>
