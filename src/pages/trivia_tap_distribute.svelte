<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface DistributeData {
    availableDrinks?: number;
    losers?: string[];
  }

  $: pData = ($gameState?.page_data || {}) as DistributeData;
  $: availableTotal = pData?.availableDrinks || 1;
  $: losers = pData?.losers || [];

  let allocations: Record<string, number> = {};
  let prevLosersKey = "";

  $: {
    const key = (losers || []).join(",");
    if (key !== prevLosersKey) {
      prevLosersKey = key;
      const next: Record<string, number> = {};
      (losers || []).forEach((l) => {
        next[l] = 0;
      });
      allocations = next;
    }
  }

  // Calculate allocated vs remaining
  $: totalAllocated = Object.values(allocations).reduce((sum, n) => sum + (n || 0), 0);
  $: remainingDrinks = Math.max(0, availableTotal - totalAllocated);

  let isSubmitted = false;

  function handleSliderChange(target: string, val: number) {
    if (isSubmitted) return;
    const current = allocations[target] || 0;
    const maxPossible = current + remainingDrinks;
    const clamped = Math.max(0, Math.min(val, maxPossible));
    allocations[target] = clamped;
    allocations = { ...allocations };
  }

  function adjustDrinks(target: string, delta: number) {
    if (isSubmitted) return;
    const current = allocations[target] || 0;
    if (delta > 0 && remainingDrinks <= 0) return;
    if (delta < 0 && current <= 0) return;

    allocations[target] = Math.max(0, current + delta);
    allocations = { ...allocations };
  }

  function splitEvenly() {
    if (isSubmitted || losers.length === 0) return;
    const next: Record<string, number> = {};
    const base = Math.floor(availableTotal / losers.length);
    let remainder = availableTotal % losers.length;

    losers.forEach((l) => {
      next[l] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    });
    allocations = next;
  }

  function resetAll() {
    if (isSubmitted) return;
    const next: Record<string, number> = {};
    losers.forEach((l) => {
      next[l] = 0;
    });
    allocations = next;
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
  class="flex flex-col justify-center items-center min-h-full w-full max-w-md mx-auto px-4 py-4 text-center select-none"
>
  {#if !isSubmitted}
    <!-- Main Distribution Card -->
    <div
      class="w-full bg-base-200/90 text-base-content border border-base-content/15 rounded-2xl p-5 shadow-xl text-left"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-xl font-black uppercase tracking-tight flex items-center gap-2">
          <span>🍺</span>
          <span>SERVE DRINKS</span>
        </h1>
        <div class="flex items-center gap-1.5">
          {#if losers.length > 1}
            <button
              type="button"
              on:click={splitEvenly}
              class="btn btn-xs btn-outline font-bold"
            >
              Split
            </button>
          {/if}
          <button
            type="button"
            on:click={resetAll}
            class="btn btn-xs btn-ghost text-base-content/60"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Drinks Pool Status Badge -->
      <div
        class="w-full p-3 rounded-xl mb-4 text-center flex items-center justify-between {remainingDrinks === 0 ? 'bg-success/20 text-success border border-success/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}"
      >
        <span class="text-xs uppercase font-black tracking-wider">
          {remainingDrinks === 0 ? 'ALL DRINKS ASSIGNED!' : 'DRINKS LEFT TO GIVE:'}
        </span>
        <span class="text-xl font-black">
          {remainingDrinks} / {availableTotal}
        </span>
      </div>

      <!-- Losers Sliders List -->
      <div class="flex flex-col gap-3.5 mb-5">
        {#each losers as loser}
          <div
            class="p-3.5 bg-base-100 rounded-xl border border-base-content/10 shadow-sm flex flex-col gap-2"
          >
            <!-- Player Name & Current Allocation Count -->
            <div class="flex items-center justify-between">
              <span class="font-bold text-base text-base-content">{loser}</span>
              <span
                class="px-2.5 py-1 rounded-lg text-xs font-black {(allocations[loser] || 0) > 0 ? 'bg-amber-500 text-stone-950 shadow-sm' : 'bg-base-300 text-base-content/50'}"
              >
                🍺 {allocations[loser] || 0} {(allocations[loser] || 0) === 1 ? 'DRINK' : 'DRINKS'}
              </span>
            </div>

            <!-- Intuitive Slider with Quick Steppers -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                on:click={() => adjustDrinks(loser, -1)}
                disabled={(allocations[loser] || 0) <= 0}
                class="btn btn-circle btn-sm btn-ghost border border-base-content/20 text-lg font-black shrink-0"
              >
                -
              </button>

              <input
                type="range"
                min="0"
                max={availableTotal}
                step="1"
                value={allocations[loser] || 0}
                on:input={(e) => handleSliderChange(loser, parseInt(e.currentTarget.value) || 0)}
                class="range range-primary range-sm w-full cursor-pointer"
              />

              <button
                type="button"
                on:click={() => adjustDrinks(loser, 1)}
                disabled={remainingDrinks <= 0}
                class="btn btn-circle btn-sm btn-ghost border border-base-content/20 text-lg font-black shrink-0"
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
        disabled={totalAllocated === 0}
        class="btn btn-primary btn-lg w-full font-black text-base uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40"
      >
        SERVE {totalAllocated} {totalAllocated === 1 ? 'DRINK' : 'DRINKS'} ➔
      </button>
    </div>
  {:else}
    <!-- Confirmed State Card -->
    <div
      class="w-full bg-base-200/90 text-base-content border border-amber-500/40 p-6 shadow-xl rounded-2xl text-center"
    >
      <div class="text-4xl mb-2">🍻</div>
      <div class="text-xs uppercase font-black tracking-widest text-amber-500">
        DRINKS SERVED!
      </div>
      <h2 class="text-2xl font-black uppercase mt-2 mb-2">
        ORDER SENT
      </h2>
      <p class="text-xs text-base-content/70 font-semibold">
        Watch the pints fly into their trays on the TV!
      </p>
    </div>
  {/if}
</div>
