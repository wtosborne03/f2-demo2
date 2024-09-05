<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { get } from "svelte/store";
  import type { photoPickerData } from "../types/page_data";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { send } from "vite";

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
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
  Pick the photo that you think represent you best.
  <div class="flex flex-col justify-between">
    <button
      type="button"
      class="btn-icon variant-filled"
      disabled={s_data.photo_index === 0}
      on:click={carouselLeft}
    >
      <i class="fa-solid fa-arrow-left" />
    </button>
    <span class="text-xl font-bold">Photo {s_data.photo_index + 1}</span>
    <button
      type="button"
      class="btn-icon variant-filled"
      disabled={s_data.photo_index === s_data.photo_amount - 1}
      on:click={carouselRight}
    >
      <i class="fa-solid fa-arrow-right" />
    </button>
  </div>
  <button type="button" class="btn variant-filled text-lg"
    >Vote for Photo {s_data.photo_index + 1}</button
  >
</div>
