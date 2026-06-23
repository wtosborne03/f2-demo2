<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { matchPerson, PromptData } from "../types/page_data";

  import Canvas from "../lib/components/canvas.svelte";
  import Palette from "$lib/components/palette.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

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

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let name = "";
  let age = 0;
  let job = "";
  let description = "";

  let canvasComponent: any;
  let isFullscreen = false;
  let previewImage: string | null = null;

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      },
    };
  }

  function minimize() {
    isFullscreen = false;
    if (canvasComponent) {
      previewImage = canvasComponent.toDataURL();
    }
  }

  async function submit_prompt() {
    if (!canvasComponent) return;
    const base64Image = canvasComponent.toDataURL();
    if (!base64Image) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/upload/base64`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ base64: base64Image }),
        },
      );

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      gameClient.sendInput({
        type: "sketchProfile",
        sketchProfile: {
          name: name,
          age: age,
          job: job,
          description: description,
          sketch: result.url,
        },
      });
    } catch (err) {
      console.error("Sketch upload failed, falling back to base64:", err);
      gameClient.sendInput({
        type: "sketchProfile",
        sketchProfile: {
          name: name,
          age: age,
          job: job,
          description: description,
          sketch: base64Image,
        },
      });
    }
  }
</script>

<div
  class="w-screen overflow-y-visible flex flex-col items-center p-0 m-0 sm:p-8 overflow-x-hidden"
>
  <div class="w-full h-fit flex flex-col sm:w-full sm:max-w-lg rounded-3xl">
    <form
      class="p-6 flex-1 flex flex-col gap-4 h-fit"
      on:submit|preventDefault={submit_prompt}
    >
      <div class="w-full">
        <div
          class="flex items-center gap-4 bg-gray-50 border-2 border-gray-200 rounded-full px-5 transition-all focus-within:border-[#ff6b6b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ff6b6b]/10 focus-within:scale-[1.02]"
        >
          <span class="font-semibold text-gray-500 text-base whitespace-nowrap"
            >Name</span
          >
          <input
            class="border-none text-black placeholder-gray-400 bg-transparent py-4 flex-1 focus:ring-0 text-base outline-none"
            type="text"
            bind:value={name}
            maxlength="20"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div class="w-full">
        <div
          class="flex items-center gap-4 bg-gray-50 border-2 border-gray-200 rounded-full px-5 transition-all focus-within:border-[#ff6b6b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ff6b6b]/10 focus-within:scale-[1.02]"
        >
          <span class="font-semibold text-gray-500 text-base whitespace-nowrap"
            >Age</span
          >
          <input
            class="border-none text-black placeholder-gray-400 bg-transparent py-4 flex-1 focus:ring-0 text-base outline-none"
            type="number"
            pattern="\d*"
            max="1000"
            placeholder="25"
            bind:value={age}
          />
        </div>
      </div>

      <div class="w-full">
        <div
          class="flex items-center gap-4 bg-gray-50 border-2 border-gray-200 rounded-full px-5 transition-all focus-within:border-[#ff6b6b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ff6b6b]/10 focus-within:scale-[1.02]"
        >
          <span class="font-semibold text-gray-500 text-base whitespace-nowrap"
            >Occupation</span
          >
          <input
            class="border-none text-black placeholder-gray-400 bg-transparent py-4 flex-1 focus:ring-0 text-base outline-none"
            type="text"
            maxlength="30"
            bind:value={job}
            placeholder="Software Engineer"
          />
        </div>
      </div>

      <div class="w-full">
        <div
          class="flex flex-col gap-2 bg-gray-50 border-2 border-gray-200 rounded-3xl p-4 transition-all focus-within:border-[#ff6b6b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ff6b6b]/10 focus-within:scale-[1.02]"
        >
          <span class="font-semibold text-gray-500 text-base"
            >Bio</span
          >
          <textarea
            class="border-none text-black placeholder-gray-400 bg-transparent p-0 w-full focus:ring-0 text-base outline-none resize-none font-sans"
            maxlength="65"
            bind:value={description}
            placeholder="About you..."
            rows="2"
          ></textarea>
        </div>
      </div>

      <div class="mt-2 flex flex-col items-center px-7">
        <!-- Interactive Preview Card -->
        <button
          type="button"
          class="relative w-full max-w-xs aspect-[2/3] rounded-3xl overflow-hidden shadow-lg mb-6 bg-slate-50 border-4 border-dashed border-gray-300 hover:border-[#ff6b6b] hover:bg-white hover:shadow-xl transition-all cursor-pointer group flex flex-col items-center justify-center p-1 text-left"
          on:click={() => (isFullscreen = true)}
        >
          {#if previewImage}
            <img
              src={previewImage}
              alt="Portrait sketch"
              class="w-full h-full object-cover rounded-2xl"
            />
          {:else}
            <div
              class="flex flex-col items-center justify-center text-gray-400 gap-3 py-12"
            >
              <span class="text-5xl animate-bounce duration-1000">🎨</span>
              <span class="font-bold text-base text-gray-500"
                >Tap to Draw Portrait</span
              >
              <span class="text-xs text-gray-400 px-4 text-center"
                >Add a sketch to complete your profile</span
              >
            </div>
          {/if}

          <!-- Pencil Overlay Badge (Glassmorphic) -->
          <div
            class="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-full border border-gray-200/50 shadow-md text-gray-700 hover:text-[#ff6b6b] transition-colors flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
          </div>
        </button>
      </div>

      <button
        type="submit"
        class="w-full p-5 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] text-white border-none rounded-full text-xl font-bold cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-[#ff6b6b]/40 mb-4 shrink-0"
      >
        <span class="text-2xl animate-pulse">❤️</span>
        <span class="font-bold tracking-wide">Let's Match!</span>
        <span class="text-2xl animate-pulse">❤️</span>
      </button>
    </form>
  </div>
</div>

<!-- Fullscreen Drawing Overlay Modal -->
<div
  use:portal
  class="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-0 sm:p-4 bg-slate-950/95 backdrop-blur-md transition-all duration-300 {isFullscreen
    ? 'opacity-100 pointer-events-auto visible'
    : 'opacity-0 pointer-events-none invisible'}"
>
  <!-- Top bar / Header -->
  <div
    class="w-full max-w-md flex justify-between items-center px-4 py-3 shrink-0 z-10 sm:px-2"
  >
    <button
      type="button"
      class="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
      on:click={minimize}
      aria-label="Back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="2.5"
        stroke="currentColor"
        class="w-7 h-7"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 19.5L8.25 12l7.5-7.5"
        />
      </svg>
    </button>
    <h3 class="text-xl font-extrabold text-white tracking-wide drop-shadow-md">
      ✨ Draw Your Portrait ✨
    </h3>
    <button
      type="button"
      class="px-5 py-2.5 bg-gradient-to-r from-[#ff6b6b] to-[#ff8e53] text-white font-extrabold rounded-full shadow-lg shadow-[#ff6b6b]/40 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-1.5"
      on:click={minimize}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="3"
        stroke="currentColor"
        class="w-4 h-4"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
      Done
    </button>
  </div>

  <!-- Drawing Area Card -->
  <div
    class="absolute inset-0 w-full h-full z-0 sm:relative sm:inset-auto sm:flex-1 sm:flex sm:items-center sm:justify-center sm:max-h-[60vh] sm:p-2"
  >
    <div
      class="w-full h-full sm:w-full sm:max-w-sm sm:aspect-[2/3] sm:rounded-3xl overflow-hidden sm:shadow-2xl bg-white sm:border-4 sm:border-slate-800 animate-fade-in"
    >
      <Canvas
        bind:this={canvasComponent}
        {color}
        {background}
        active={isFullscreen}
      />
    </div>
  </div>

  <!-- Bottom controls / Palette & Tools -->
  <div
    class="w-full max-w-md p-4 flex flex-col items-center gap-3 shrink-0 z-10 mb-0 sm:mb-4"
  >
    <Palette
      paletteColor={color}
      {colors}
      {background}
      on:color={({ detail }) => {
        color = detail.color;
      }}
      on:clear={() => {
        if (canvasComponent) {
          canvasComponent.clear();
          previewImage = null;
        }
      }}
    />
  </div>
</div>
