<script lang="ts">
  import { get } from "svelte/store";
  import type { DoodleData } from "../types/page_data";
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

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center space-y-6">
  <div class="text-2xl font-black leading-snug">
    Drawing Prompt: <span class="text-primary">{m_data.prompt}</span>
  </div>

  <form class="flex flex-col items-center w-full gap-4" onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}>
    <div class="w-full flex justify-center shadow-lg border border-base-300 rounded-2xl overflow-hidden bg-white">
      <Canvas square {color} {background} />
    </div>

    <Palette
      {paletteColor}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
    />

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full text-lg font-bold mt-4"
    >
      Submit Drawing
    </button>
  </form>
</div>
