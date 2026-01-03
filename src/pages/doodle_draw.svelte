<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { DoodleData, matchPerson, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";

  const colors = ["#000000", "#ffffff"];
  const background = "#fff";

  let color = colors[0];
  const paletteColor = color;

  let m_data: DoodleData;
  m_data = get(gameState).page_data;

  function submit_prompt() {
    const image = (
      document.getElementById("draw-canvas") as HTMLCanvasElement
    ).toDataURL("image/png");

    gameClient.sendPlayerInput("doodle", {
      data: {
        type: "answer",
        data: image,
      },
    });
  }
</script>

<div
  class="container h-full min-h-screen mx-auto flex flex-col justify-center items-center"
>
  <div class="text-2xl mb-3">Drawing Prompt: {m_data.prompt}</div>
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
    <button class="btn preset-filled mb-24 mt-12 px-10" on:click={submit_prompt}
      >Submit</button
    >
  </form>
</div>
