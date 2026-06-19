<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined } from "m3-svelte";
  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";

  const colors = [
    "#000000", // Black
    "#FF6B6B", // Bright Red/Coral
    "#4ECDC4", // Teal/Cyan
    "#45B7D1", // Sky Blue
    "#FFA07A", // Light Salmon/Peach
    "#F7DC6F", // Sunny Yellow
  ];
  const background = "#fff";

  let color = colors[0];
  let paletteColor = color;
  let answer_text = "";
  let submitting = false;

  async function submit_prompt() {
    if (submitting) return;
    submitting = true;

    const canvas = document.getElementById("draw-canvas") as HTMLCanvasElement;
    if (!canvas) {
      submitting = false;
      return;
    }
    const base64Image = canvas.toDataURL("image/png");

    let sketchUrl = "";
    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/upload/base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ base64: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      sketchUrl = result.url;
    } catch (err) {
      console.error("Sketch upload failed, falling back to base64:", err);
      sketchUrl = base64Image;
    }

    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
      sketch: sketchUrl,
    });
  }
</script>

<div
  class="w-screen min-h-screen overflow-y-auto flex flex-col items-center p-4 sm:p-8 overflow-x-hidden"
>
  <div class="header-icon text-5xl mb-2">🎨</div>
  <div class="subtitle-text">Prompt & Circumstance</div>
  <div class="instruction-text mb-4">Draw a sketch and write what it is!</div>

  <form class="flex flex-col justify-center items-center w-full max-w-md gap-4 pb-8" on:submit|preventDefault={submit_prompt}>
    <div class="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl mb-2 bg-white border-4 border-stone-400">
      <Canvas {color} {background} square={true} />
    </div>

    <div class="mb-4 flex justify-center w-full">
      <Palette
        {paletteColor}
        {colors}
        {background}
        on:color={({ detail }) => {
          color = detail.color;
        }}
        on:clear={() => {
          const canvas = document.getElementById("draw-canvas") as HTMLCanvasElement;
          const ctx = canvas?.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }}
      />
    </div>

    <div class="field-wrapper w-full mb-2">
      <TextFieldOutlined
        label="What is this supposed to be?"
        type="text"
        maxlength={128}
        placeholder="e.g., A cat riding a skateboard"
        bind:value={answer_text}
      />
      <div class="text-right text-xs text-stone-400 mt-1">
        {answer_text.length} / 128
      </div>
    </div>

    {#if submitting}
      <button type="button" disabled class="w-full py-4 bg-stone-300 text-stone-600 rounded-full font-bold cursor-not-allowed">
        Uploading sketch...
      </button>
    {:else}
      <GameSubmit onSubmit={submit_prompt} />
    {/if}
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
    color: var(--m3c-primary);
    text-transform: uppercase;
    letter-spacing: 0.1rem;
    margin-bottom: 0.25rem;
  }

  .instruction-text {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 600;
    text-align: center;
    color: var(--m3c-on-background);
  }

  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }
</style>
