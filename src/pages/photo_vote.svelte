<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { get } from "svelte/store";
  import type { photoPickerData, photoVoteData } from "../types/page_data";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import Icon from "@iconify/svelte";
  import Carousel from "../components/carousel.svelte";
  import { browser } from "$app/environment";

  let s_data: photoVoteData;
  s_data = get<PlayerState>(player_state).page_data;

  let p_index = 0;

  function handleCarouselChange(event: any) {
    p_index = event.detail.currentSlide;
  }

  function submit_answer() {
    sendMessage({
      type: "game",
      data: {
        type: "vote",
        data: Object.keys(s_data.photos)[p_index],
      },
    });
  }
</script>

<div
  class=" h-full overflow-scroll flex flex-col justify-center items-center text-2xl text-center"
>
  <div class="mb-4 flex">Pick the photo that you think represent you best.</div>
  <div class="w-full">
    <Carousel perPage={1} autoplay={0} on:change={handleCarouselChange}>
      {#each Object.keys(s_data.photos) as photo}
        <img
          src={s_data.photos[photo]}
          alt="pho"
          class=" object-contain"
          style:height="60vh"
          style:width="100%"
        />
      {/each}
    </Carousel>
  </div>
  <button
    type="button"
    class="btn variant-filled text-2xl mt-4"
    on:click={submit_answer}>Vote for Photo</button
  >
</div>
