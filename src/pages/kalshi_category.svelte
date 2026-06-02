<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";

  let submitted = false;

  const categories = [
    { name: "Climate & Weather", emoji: "🌦️", color: "from-sky-500 to-blue-600" },
    { name: "Sports", emoji: "🏆", color: "from-orange-500 to-red-600" },
    { name: "Politics & Elections", emoji: "🗳️", color: "from-indigo-600 to-purple-700" },
    { name: "Economy & Finance", emoji: "📈", color: "from-emerald-500 to-teal-600" },
    { name: "Science & Tech", emoji: "🚀", color: "from-cyan-500 to-indigo-500" },
    { name: "Pop Culture & Entertainment", emoji: "🎬", color: "from-pink-500 to-rose-600" }
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

<div class="w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between p-6 text-white font-sans selection:bg-emerald-500 selection:text-white">
  {#if !submitted}
    <div class="flex-grow flex flex-col justify-center items-center gap-6" in:scale={{ duration: 300 }}>
      <div class="text-center space-y-2 max-w-sm">
        <h1 class="text-3xl font-black tracking-tight text-emerald-400">YOU ARE THE CHOOSER</h1>
        <p class="text-slate-400 font-medium text-sm">Pick a category for this round of prediction markets!</p>
      </div>

      <div class="grid grid-cols-2 gap-4 w-full max-w-md">
        {#each categories as cat}
          <button
            on:click={() => selectCategory(cat.name)}
            class="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center hover:border-emerald-500 active:scale-95 transition-all duration-150 relative overflow-hidden group h-32"
          >
            <div class="absolute inset-0 bg-gradient-to-br {cat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <span class="text-3xl mb-2">{cat.emoji}</span>
            <span class="font-bold text-xs sm:text-sm tracking-wide text-slate-200 group-hover:text-white">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <div class="flex-grow flex flex-col items-center justify-center text-center space-y-6" in:scale={{ duration: 400, start: 0.9 }}>
      <div class="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shadow-lg border border-emerald-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-slate-100">Category Locked In!</h2>
        <p class="text-slate-400 text-sm">Category chosen. Setting up the market on the main screen...</p>
      </div>
    </div>
  {/if}
</div>
