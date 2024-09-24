<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { get } from "svelte/store";
  import type { photoPickerData } from "../types/page_data";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import Icon from "@iconify/svelte";

  let s_data: photoPickerData;
  s_data = get<PlayerState>(player_state).page_data;

  $: s_data,
    sendMessage({ type: "game", data: { type: "photo_picker", data: s_data } });

  function carouselLeft() {
    s_data.photo_index -= 1;
  }
  function carouselRight() {
    s_data.photo_index += 1;
  }
  function submit_answer() {
    sendMessage({
      type: "game",
      data: {
        type: "vote",
      },
    });
  }
</script>

<div
  class="container h-full mx-auto flex flex-col justify-center items-center text-2xl"
>
  Pick the photo that you think represent you best.
  <div class="flex flex-row w-full p-8 justify-between items-center">
    <button
      type="button"
      class="btn-icon"
      disabled={s_data.photo_index === 0}
      on:click={carouselLeft}
    >
      <Icon icon="icon-park-solid:left-c" width="64" height="64" />
    </button>
    <span class="text-3xl font-bold">Photo {s_data.photo_index + 1}</span>
    <button
      type="button"
      class="btn-icon"
      disabled={s_data.photo_index === s_data.photo_amount - 1}
      on:click={carouselRight}
    >
      <Icon icon="icon-park-solid:right-c" width="64" height="64" />
    </button>
  </div>
  <button
    type="button"
    class="btn variant-filled text-2xl"
    on:click={submit_answer}>Vote for Photo</button
  >
</div>
