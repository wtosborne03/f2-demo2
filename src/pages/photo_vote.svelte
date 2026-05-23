<script lang="ts">
  import { get } from "svelte/store";
  import type { photoPickerData, photoVoteData } from "../types/page_data";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

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

<div class="h-full flex flex-col items-center text-2xl text-center px-4 w-full">
  <div class="w-full flex-1 flex flex-col items-center justify-center">
    <PhotoCarousel
      wrap={false}
      {items}
      height="60vh"
      bind:currentIndex={p_index}
    />
  </div>

  <div class="w-full flex justify-center pb-6 mt-6 btn-wrapper">
    <Button variant="filled" size="l" onclick={submit_answer}>
      Vote
      <Icon
        style="font-size: 1.5rem; margin-left: 0.5rem;"
        icon="fa7-solid:vote-yea"
      />
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
