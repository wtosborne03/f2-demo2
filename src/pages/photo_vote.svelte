<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { photoPickerData, photoVoteData } from "../types/page_data";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import Icon from "@iconify/svelte";
  import PhotoCarousel from "$lib/components/PhotoCarousel.svelte";
  import { gameClient } from "$lib/gameService";

  let s_data: photoVoteData;
  s_data = get(player_state).pageData;

  let p_index = 0;

  // items exposed to the carousel as [{id, src}]
  $: items = Object.entries(s_data.photos || {}).map(([id, src]) => ({
    id,
    src: String(src),
  }));

  function submit_answer() {
    const photoId = items[p_index]?.id || "No Photo";
    gameClient.sendPlayerInput({
      payload: {
        $case: "votePhotoData",
        votePhotoData: {
          photoIndex: photoId,
        },
      },
    });
  }
</script>

<div class="h-full flex flex-col items-center text-2xl text-center">
  <div class="w-full flex-1 flex flex-col items-center justify-center">
    <PhotoCarousel
      wrap={false}
      {items}
      height="60vh"
      bind:currentIndex={p_index}
    />
  </div>

  <div class="w-full flex justify-center pb-6 mt-6">
    <button
      type="button"
      class="btn preset-filled text-2xl px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 shadow-lg"
      on:click={submit_answer}
      aria-label="Vote for selected photo"
    >
      Vote
      <Icon font-size="1.8rem" icon="fa7-solid:vote-yea" />
    </button>
  </div>
</div>
