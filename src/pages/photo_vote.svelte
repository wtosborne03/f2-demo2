<script lang="ts">
  import { get } from "svelte/store";
  import type { photoVoteData } from "../types/page_data";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let s_data: photoVoteData;
  s_data = get(gameState).page_data;

  let p_index = 0;

  $: items = Object.entries(s_data.photos || {}).map(([id, src]) => ({
    id,
    src: String(src),
  }));

  function submit_answer() {
    const photoId = items[p_index]?.id || "No Photo";
    gameClient.sendInput({
      type: "votePhotoData",
      votePhotoData: {
        photoIndex: photoId,
      },
    });
  }
</script>

<div class="flex flex-col justify-between h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="w-full flex-grow flex flex-col justify-center items-center">
    <PhotoCarousel
      wrap={false}
      {items}
      height="50vh"
      bind:currentIndex={p_index}
    />
  </div>

  <div class="w-full mt-8">
    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-2"
      onclick={submit_answer}
    >
      <span>Vote</span>
      <Icon
        icon="fa7-solid:vote-yea"
        class="text-xl"
      />
    </button>
  </div>
</div>
