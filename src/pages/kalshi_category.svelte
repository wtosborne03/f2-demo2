<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";

  let submitted = false;

  const categories = [
    { name: "Climate & Weather", emoji: "🌦️", color: "#2563EB" },
    { name: "Sports", emoji: "🏆", color: "#FFC82C" },
    { name: "Politics & Elections", emoji: "🗳️", color: "#EF4444" },
    { name: "Economy & Finance", emoji: "📈", color: "#10B981" },
    { name: "Science & Tech", emoji: "🚀", color: "#2563EB" },
    { name: "Pop Culture & Entertainment", emoji: "🎬", color: "#FFC82C" },
  ];

  function selectCategory(category: string) {
    if (submitted) return;
    submitted = true;
    gameClient.sendInput({
      type: "kalshi_category",
      category: category,
    });
  }
</script>

<div
  class="kalshi-page w-full max-w-md mx-auto flex flex-col justify-center p-5 font-sans"
>
  {#if !submitted}
    <div
      class="w-full flex flex-col items-center gap-5"
      in:scale={{ duration: 300 }}
    >
      <div class="text-center space-y-2 max-w-sm">
        <span
          class="inline-block px-3 py-1 bg-[#FFC82C] border-[2px] border-[#11141A] shadow-[2px_2px_0px_#11141A] text-xs font-black tracking-widest uppercase rounded-full text-[#11141A]"
        >
          Chooser Round
        </span>
        <h1
          class="text-3xl font-black tracking-tight text-[#11141A] uppercase"
        >
          YOU ARE THE CHOOSER
        </h1>
        <p class="text-[#11141A]/75 font-bold text-sm">
          Select a category for this round of prediction markets!
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3.5 w-full">
        {#each categories as cat}
          <button
            on:click={() => selectCategory(cat.name)}
            class="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-white border-[2.5px] border-[#11141A] shadow-[3px_3px_0px_#11141A] hover:shadow-[5px_5px_0px_#11141A] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center h-32 cursor-pointer overflow-hidden"
          >
            <div
              class="absolute top-0 left-0 right-0 h-1.5"
              style="background-color: {cat.color};"
            ></div>
            <span
              class="text-3xl mb-2 group-hover:scale-110 transition-transform"
              >{cat.emoji}</span
            >
            <span
              class="font-black text-xs sm:text-sm tracking-wide text-[#11141A] leading-snug"
              >{cat.name}</span
            >
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div
      class="w-full bg-white border-[2.5px] border-[#11141A] shadow-[4px_4px_0px_#11141A] rounded-xl flex flex-col items-center justify-center text-center gap-5 p-8 my-auto"
      in:scale={{ duration: 400, start: 0.9 }}
    >
      <div
        class="w-16 h-16 bg-[#FFC82C] border-[2.5px] border-[#11141A] shadow-[3px_3px_0px_#11141A] rounded-full flex items-center justify-center text-[#11141A]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div class="space-y-2">
        <h2
          class="text-2xl font-black text-[#11141A] uppercase tracking-tight"
        >
          Category Locked In!
        </h2>
        <p class="text-[#11141A]/80 text-sm font-bold">
          Category chosen. Setting up the market on the TV screen...
        </p>
      </div>
    </div>
  {/if}
</div>
