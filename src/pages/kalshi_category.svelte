<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";

  let submitted = false;

  const categories = [
    { name: "Climate & Weather", emoji: "🌦️" },
    { name: "Sports", emoji: "🏆" },
    { name: "Politics & Elections", emoji: "🗳️" },
    { name: "Economy & Finance", emoji: "📈" },
    { name: "Science & Tech", emoji: "🚀" },
    { name: "Pop Culture & Entertainment", emoji: "🎬" }
  ];

  function selectCategory(category: string) {
    if (submitted) return;
    submitted = true;
    gameClient.sendInput({
      type: "kalshi_category",
      category: category
    });
  }
</script>

<div class="w-full h-full min-h-screen bg-[#00DD94] flex flex-col justify-between p-6 text-[#080c14] font-sans">
  {#if !submitted}
    <div class="flex-grow flex flex-col justify-center items-center gap-6" in:scale={{ duration: 300 }}>
      <div class="text-center space-y-2 max-w-sm">
        <h1 class="text-3xl font-black tracking-tight text-[#080c14]">YOU ARE THE CHOOSER</h1>
        <p class="text-[#080c14]/70 font-semibold text-sm">Pick a category for this round of prediction markets!</p>
      </div>

      <div class="grid grid-cols-2 gap-4 w-full max-w-md">
        {#each categories as cat}
          <button
            on:click={() => selectCategory(cat.name)}
            class="flex flex-col items-center justify-center p-5 rounded-lg bg-[#080c14]/10 hover:bg-[#080c14]/20 text-center active:scale-95 transition-all duration-150 h-32"
          >
            <span class="text-3xl mb-2">{cat.emoji}</span>
            <span class="font-bold text-xs sm:text-sm tracking-wide text-[#080c14]">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="flex-grow flex flex-col items-center justify-center text-center space-y-6" in:scale={{ duration: 400, start: 0.9 }}>
      <div class="w-20 h-20 bg-[#080c14]/10 text-[#080c14] rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-[#080c14]">Category Locked In!</h2>
        <p class="text-[#080c14]/70 text-sm font-semibold">Category chosen. Setting up the market on the main screen...</p>
      </div>
    </div>
  {/if}
</div>
