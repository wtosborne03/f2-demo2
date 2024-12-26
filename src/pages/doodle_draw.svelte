<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { DoodleData, matchPerson, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  import Canvas from "../components/canvas.svelte";
  import Palette from "../components/palette.svelte";

  const colors = ["#000000", "#ffffff"];
  const background = "#fff";

  let color = colors[0];
  const paletteColor = color;

  let m_data: DoodleData;
  m_data = get<PlayerState>(player_state).page_data;

  function submit_prompt() {
    const image = (
      document.getElementById("draw-canvas") as HTMLCanvasElement
    ).toDataURL("image/png");

    const m_match = {
      sketch: image,
    };

    sendMessage({
      type: "game",
      data: {
        type: "answer",
        data: m_match,
      },
    });
  }
</script>

<div
  class="container h-full min-h-screen mx-auto flex justify-center items-center"
>
  <div class="text-2xl mb-3">Drawing Prompt: {m_data.prompt}</div>
  <form class=" flex flex-col justify-center items-center gap-4 my-12">
    <span>Sketch</span>

    <Canvas {color} {background} />
    <Palette
      {paletteColor}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
    />
    <button class="btn variant-filled mb-24" on:click={submit_prompt}
      >Submit</button
    >
  </form>
</div>
