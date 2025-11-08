<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ProductPromptData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  import Canvas from "$lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";

  const colors = ["#000000", "#ffffff"];
  const background = "#fff";

  let color = colors[0];
  const paletteColor = color;

  let m_data: ProductPromptData;
  m_data = get<PlayerState>(player_state).page_data;

  function submit_prompt() {
    const image = (
      document.getElementById("draw-canvas") as HTMLCanvasElement
    ).toDataURL("image/png");

    sendMessage({
      type: "game",
      data: {
        type: "product",
        part: "image",
        data: image,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4 text-center">Draw an image of your product</div>
  <form class=" flex flex-col justify-center items-center gap-4 my-12">
    <Canvas square {color} {background} />
    <Palette
      {paletteColor}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
    />
    <button
      class="btn preset-filled mb-24 mt-12 px-10"
      on:click={submit_prompt}>Submit</button
    >
  </form>
</div>
