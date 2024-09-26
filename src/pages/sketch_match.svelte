<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { matchPerson, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  import Canvas from "../components/canvas.svelte";
  import Palette from "../components/palette.svelte";

  const colors = ["#d58141", "#d7c44c", "#4fa9cc", "#3f8d27"];
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
    ).toDataURL("image/jpeg");

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

<div class="container h-full mx-auto flex justify-center items-center">
  <form class=" flex flex-col justify-center items-center gap-4 my-12">
    <label class="label w-full">
      <span>Name</span>
      <input
        class="input w-full"
        type="text"
        bind:value={name}
        placeholder="Input"
      />
    </label>
    <label class="label w-full">
      <span>Age</span>
      <input
        class="input w-full"
        type="number"
        bind:value={age}
        placeholder="Input"
      />
    </label>
    <label class="label w-full">
      <span>Job</span>
      <input
        class="input w-full"
        type="text"
        bind:value={job}
        placeholder="Input"
      />
    </label>
    <label class="label w-full">
      <span>description</span>
      <input
        class="input w-full"
        type="text"
        bind:value={description}
        placeholder="Input"
      />
    </label>
    <label class="label w-full">
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
    </label>
    <button class="btn variant-filled" on:click={submit_prompt}>Submit</button>
  </form>
</div>
