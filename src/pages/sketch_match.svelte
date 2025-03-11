<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { matchPerson, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";

  const colors = [
    "#d7c44c",
    "#000000",
    "#ffffff",
    "#d7c44c",
    "#4fa9cc",
    "#3f8d27",
  ];
  const background = "#fff";

  let color = colors[0];
  const paletteColor = color;

  let m_data: PromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let name = "";
  let age = 0;
  let job = "";
  let description = "";

  function submit_prompt() {
    const image = (
      document.getElementById("draw-canvas") as HTMLCanvasElement
    ).toDataURL("image/png");

    const m_match: matchPerson = {
      name: name,
      age: age,
      job: job,
      description: description,
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
  <form class=" flex flex-col justify-center items-center gap-4 my-12">
    <input
      class="input w-full"
      type="text"
      bind:value={name}
      maxlength="20"
      placeholder="Name"
    />
    <div class="w-full flex flex-row justify-center gap-4 items-center">
      Age:
      <input
        class="input w-full"
        type="number"
        pattern="\d*"
        max="1000"
        placeholder={"40"}
        bind:value={age}
      />
    </div>

    <input
      class="input w-full"
      type="text"
      maxlength="30"
      bind:value={job}
      placeholder="Job"
    />
    <input
      class="input w-full"
      type="text"
      maxlength="65"
      bind:value={description}
      placeholder="Description"
    />

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
