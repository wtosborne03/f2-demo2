<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface DistributeData {
    availableDrinks: number;
    losers: string[];
  }

  const pData = (get(gameState).page_data || {}) as DistributeData;
  const availableTotal = pData.availableDrinks || 1;
  const losers = pData.losers || [];

  // Track drink allocation per losing player
  let allocations: Record<string, number> = {};
  losers.forEach((l) => {
    allocations[l] = 0;
  });

  // Calculate allocated vs remaining
  $: totalAllocated = Object.values(allocations).reduce((sum, n) => sum + n, 0);
  $: remainingDrinks = availableTotal - totalAllocated;

  let isSubmitted = false;

  function adjustDrinks(target: string, delta: number) {
    if (isSubmitted) return;
    const current = allocations[target] || 0;
    if (delta > 0 && remainingDrinks <= 0) return;
    if (delta < 0 && current <= 0) return;

    allocations[target] = current + delta;
    allocations = { ...allocations }; // trigger reactivity
  }

  function submitAllocations() {
    if (isSubmitted) return;
    isSubmitted = true;
    gameClient.sendInput({
      type: "distribute_drinks",
      allocations,
    });
  }
</script>

<div
  class="min-h-full w-full flex flex-col justify-center items-center p-4 bg-[#0c0a09] text-[#e7e5e4] font-mono select-none"
>
  {#if !isSubmitted}
    <!-- Tavern Tab Container -->
    <div
      class="w-full max-w-sm bg-[#fbfbf9] text-[#1c1917] border-2 border-dashed border-[#78716c] border-t-8 border-t-[#b45309] p-5 shadow-2xl rounded-sm -rotate-1"
    >
      <div class="text-xs uppercase tracking-widest text-[#78350f] font-black mb-1">
        🍺 ROUND WINNER PRIVILEGE
      </div>
      <h1 class="text-2xl font-black uppercase tracking-tight mb-2">
        SERVE THE DRINKS!
      </h1>

      <div class="p-2.5 bg-[#fef3c7] border border-[#d97706] rounded mb-4 text-center">
        <span class="text-xs uppercase font-bold text-[#78350f] block">
          DRINKS REMAINING TO HAND OUT:
        </span>
        <span class="text-3xl font-black text-[#b45309]">
          {remainingDrinks} / {availableTotal}
        </span>
      </div>

      <!-- Losers Distribution List -->
      <div class="flex flex-col gap-2.5 mb-5">
        {#each losers as loser}
          <div
            class="flex items-center justify-between p-2.5 bg-[#e7e5e4] border border-stone-400 rounded"
          >
            <div class="flex flex-col">
              <span class="font-black text-sm text-[#1c1917]">{loser}</span>
              <span class="text-[10px] text-stone-500 font-bold uppercase">MISS</span>
            </div>

            <!-- Plus / Minus Stepper -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                on:click={() => adjustDrinks(loser, -1)}
                disabled={(allocations[loser] || 0) <= 0}
                class="w-8 h-8 rounded bg-[#1c1917] text-white font-black text-base flex items-center justify-center disabled:opacity-30 active:scale-95"
              >
                -
              </button>

              <span class="font-black text-base w-6 text-center text-[#b45309]">
                {allocations[loser] || 0}
              </span>

              <button
                type="button"
                on:click={() => adjustDrinks(loser, 1)}
                disabled={remainingDrinks <= 0}
                class="w-8 h-8 rounded bg-[#1c1917] text-white font-black text-base flex items-center justify-center disabled:opacity-30 active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Submit Button -->
      <button
        type="button"
        on:click={submitAllocations}
        class="w-full py-3 bg-[#1c1917] text-[#fde047] font-black text-base uppercase tracking-wider rounded border border-[#78350f] shadow-lg active:translate-y-0.5 cursor-pointer"
      >
        SERVE TO LOSERS ➔
      </button>
    </div>
  {:else}
    <!-- Drinks Served Stamped Badge -->
    <div
      class="w-full max-w-sm bg-[#d6c7a1] text-[#1c1917] border-4 border-[#5c4426] p-6 shadow-2xl rounded-xl rotate-1 text-center"
    >
      <div class="text-4xl mb-2">🍻</div>
      <div class="text-xs uppercase font-black tracking-widest text-[#78350f]">
        DRINKS SERVED!
      </div>
      <h2 class="text-2xl font-black uppercase mt-1 mb-2">
        ORDER SENT!
      </h2>
      <div class="text-xs text-stone-700 font-bold">
        Watch the pints fly into their trays on the TV!
      </div>
    </div>
  {/if}
</div>
