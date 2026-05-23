<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { DoodleData, matchPerson, PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";
  import { Button } from "m3-svelte";

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
  class="container h-full min-h-screen mx-auto flex flex-col justify-center items-center px-4"
>
  <div class="prompt-text">Drawing Prompt: {m_data.prompt}</div>
  <form class="flex flex-col justify-center items-center gap-4 my-12 w-full max-w-sm" on:submit|preventDefault={submit_prompt}>
    <Canvas square {color} {background} />
    <Palette
      {paletteColor}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
    />
    <div class="btn-wrapper">
      <Button variant="filled" onclick={submit_prompt}>Submit</Button>
    </div>
  </form>
</div>

<style>
  .prompt-text {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 400;
    text-align: center;
    color: var(--m3c-on-background);
  }

  .btn-wrapper {
    margin-top: 2rem;
    width: 100%;
    margin-bottom: 6rem;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
  }
</style>
