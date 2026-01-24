<script lang="ts">
  import { get } from "svelte/store";
  import type { QuestionData } from "../types/page_data";
  import type { PlayerState } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { fade, fly } from "svelte/transition";

  interface GameData {
    name: string;
    fullName: string;
    description: string;
  }

  let m_data = get(gameState).page_data as { games: GameData[] };
  let games = m_data?.games || [];

  function submit_answer(gameName: string) {
    gameClient.sendInput({
      type: "game_choice",
      game: gameName,
    });
  }
</script>

<div
  class="relative flex h-screen w-screen overflow-hidden bg-black font-sans text-white select-none"
>
  {#if games.length >= 2}
    <!-- Left Option (Game 1) -->
    <button
      in:fly={{ x: -100, duration: 600, delay: 100 }}
      class="group relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 p-4 text-center transition-all duration-300 ease-out hover:flex-[1.3] focus:outline-none active:brightness-110"
      on:click={() => submit_answer(games[0].name)}
    >
      <!-- Background Effects -->
      <div
        class="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-125"
      ></div>

      <!-- Content -->
      <div
        class="relative z-10 flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105"
      >
        <h2
          class="text-3xl font-black uppercase leading-none tracking-tighter drop-shadow-lg sm:text-5xl md:text-6xl"
        >
          {games[0].fullName}
        </h2>
        <p
          class="max-w-[180px] text-xs font-medium uppercase tracking-wide text-white/80 sm:max-w-xs sm:text-sm"
        >
          {games[0].description}
        </p>
      </div>
    </button>

    <!-- VS Badge -->
    <div
      in:fade={{ duration: 600, delay: 400 }}
      class="absolute left-1/2 top-1/8 z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      <div
        class="relative flex h-16 w-56 items-center justify-center rounded-2xl bg-white shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        <span class="font-black italic text-center text-black text-xl"
          >Vote Next Game</span
        >
      </div>
    </div>

    <!-- Right Option (Game 2) -->
    <button
      in:fly={{ x: 100, duration: 600, delay: 100 }}
      class="group relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-bl from-red-400 to-red-600 p-4 text-center transition-all duration-300 ease-out hover:flex-[1.3] focus:outline-none active:brightness-110"
      on:click={() => submit_answer(games[1].name)}
    >
      <!-- Background Effects -->
      <div
        class="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl transition-transform duration-700 group-hover:scale-125"
      ></div>

      <!-- Content -->
      <div
        class="relative z-10 flex flex-col items-center gap-3 transition-transform duration-300 group-hover:scale-105"
      >
        <h2
          class="text-3xl font-black uppercase leading-none tracking-tighter drop-shadow-lg sm:text-5xl md:text-6xl"
        >
          {games[1].fullName}
        </h2>
        <p
          class="max-w-[180px] text-xs font-medium uppercase tracking-wide text-white/80 sm:max-w-xs sm:text-sm"
        >
          {games[1].description}
        </p>
      </div>
    </button>
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-zinc-900">
      <p class="animate-pulse font-mono text-sm text-zinc-500">
        Awaiting Options...
      </p>
    </div>
  {/if}
</div>
