<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";

  const colors = ["#000000", "#ff4757", "#2ed573", "#1e90ff", "#ffa502"];
  const background = "#ffffff";

  let color = colors[0];
  let canvasComponent: any;

  let pageData: any;
  $: pageData = $gameState.page_data || {};

  async function submitDrawing() {
    if (!canvasComponent) return;
    const base64Image = canvasComponent.toDataURL();
    if (!base64Image) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/upload/base64`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: base64Image }),
      });

      if (response.ok) {
        const result = await response.json();
        gameClient.sendInput({
          type: "promptPhotoData",
          promptPhotoData: { photoUrl: result.url },
        });
        return;
      }
    } catch (err) {
      console.warn("Sketch upload fallback to raw data URL:", err);
    }

    gameClient.sendInput({
      type: "promptPhotoData",
      promptPhotoData: { photoUrl: base64Image },
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-4 py-4 text-center space-y-4">
  <div class="text-xl font-black leading-snug">
    Draw Secret Celebrity: <span class="text-primary font-extrabold">{pageData.prompt || "Taylor Swift"}</span>
  </div>

  <form class="flex flex-col items-center w-full gap-3" onsubmit={(e) => { e.preventDefault(); submitDrawing(); }}>
    <div class="w-full flex justify-center shadow-lg border border-base-300 rounded-2xl overflow-hidden bg-white">
      <Canvas bind:this={canvasComponent} square {color} {background} />
    </div>

    <Palette
      paletteColor={color}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
      on:clear={() => {
        if (canvasComponent) canvasComponent.clear();
      }}
    />

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full text-lg font-bold mt-2"
    >
      Submit Celebrity Drawing 🎨
    </button>
  </form>
</div>
