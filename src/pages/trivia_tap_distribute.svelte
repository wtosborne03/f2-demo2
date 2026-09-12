<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface LoserItem {
    name: string;
    selfieUrl?: string;
  }

  interface DistributeData {
    availableDrinks?: number;
    losers?: (string | LoserItem)[];
    loserAvatars?: Record<string, string>;
    loserDetails?: LoserItem[];
    avatars?: Record<string, string>;
  }

  $: pData = ($gameState?.page_data || {}) as DistributeData;
  $: availableTotal = pData?.availableDrinks || 1;
  $: rawLosers = (pData?.losers || []) as (string | LoserItem)[];

  function getLoserName(item: string | LoserItem): string {
    if (typeof item === "string") return item;
    return item?.name || "";
  }

  function getLoserSelfie(item: string | LoserItem): string {
    if (typeof item === "object" && item?.selfieUrl) return item.selfieUrl;
    const name = getLoserName(item);
    if (pData?.loserAvatars?.[name]) return pData.loserAvatars[name];
    if (pData?.avatars?.[name]) return pData.avatars[name];
    return "";
  }

  $: losers = rawLosers.map((l) => getLoserName(l));

  let allocations: Record<string, number> = {};
  let prevInitKey = "";

  function calculateEvenSplit(
    list: string[],
    total: number,
  ): Record<string, number> {
    const next: Record<string, number> = {};
    if (!list.length) return next;

    const base = Math.floor(total / list.length);
    let remainder = total % list.length;

    list.forEach((l) => {
      next[l] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    });
    return next;
  }

  // Evenly distribute at init or whenever the pool/participants change
  $: {
    const initKey = `${availableTotal}:${losers.join(",")}`;
    if (initKey !== prevInitKey) {
      prevInitKey = initKey;
      allocations = calculateEvenSplit(losers, availableTotal);
    }
  }

  $: totalAllocated = Object.values(allocations).reduce(
    (sum, n) => sum + (n || 0),
    0,
  );
  $: remainingDrinks = Math.max(0, availableTotal - totalAllocated);

  let isSubmitted = false;

  /**
   * Updates `target` to `desiredVal` and steals/reallocates from other players
   * if the increase exceeds the remaining free drinks pool.
   */
  function reallocate(target: string, desiredVal: number) {
    if (isSubmitted) return;

    // Hard clamp target between 0 and total available
    const nextTargetVal = Math.max(0, Math.min(desiredVal, availableTotal));
    const currentTargetVal = allocations[target] || 0;
    const delta = nextTargetVal - currentTargetVal;

    if (delta === 0) return;

    const nextAllocations = { ...allocations, [target]: nextTargetVal };

    if (delta > 0) {
      let deficit = delta - remainingDrinks;

      // Take drinks from other players round-robin until deficit is satisfied
      while (deficit > 0) {
        const eligibleOthers = losers.filter(
          (l) => l !== target && (nextAllocations[l] || 0) > 0,
        );
        if (eligibleOthers.length === 0) break;

        for (const player of eligibleOthers) {
          if (deficit <= 0) break;
          nextAllocations[player] -= 1;
          deficit -= 1;
        }
      }
    }

    allocations = nextAllocations;
  }

  function handleSliderChange(target: string, val: number) {
    reallocate(target, val);
  }

  function adjustDrinks(target: string, delta: number) {
    const current = allocations[target] || 0;
    reallocate(target, current + delta);
  }

  function splitEvenly() {
    if (isSubmitted || losers.length === 0) return;
    allocations = calculateEvenSplit(losers, availableTotal);
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
    <div class="w-full text-base-content">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3 text-center">
        <h1
          class="text-xl font-black uppercase tracking-tight flex text-center items-center gap-2"
        >
          <span>🍺</span>
          <span>SERVE {availableTotal} DRINKS</span>
        </h1>
      </div>

      <!-- Losers Sliders List -->
      <div class="flex flex-col gap-3.5 mb-5">
        {#each rawLosers as rawLoser}
          {@const loser = getLoserName(rawLoser)}
          {@const selfieUrl = getLoserSelfie(rawLoser)}
          <div
            class="p-3.5 bg-base-100 rounded-xl border border-base-content/10 shadow-sm flex flex-col gap-2"
          >
            <!-- Player Avatar, Name & Current Allocation Count -->
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-3 min-w-0">
                {#if selfieUrl}
                  <img
                    src={selfieUrl}
                    alt={loser}
                    class="w-11 h-11 rounded-full object-cover border-2 border-amber-500/70 shadow-sm shrink-0 bg-base-300"
                  />
                {:else}
                  <div
                    class="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black text-base flex items-center justify-center border-2 border-amber-300 shadow-sm shrink-0 uppercase"
                  >
                    {loser ? loser.charAt(0).toUpperCase() : "👤"}
                  </div>
                {/if}
                <span class="font-bold text-base text-base-content truncate text-left">
                  {loser}
                </span>
              </div>

              <span
                class="px-2.5 py-1 rounded-lg text-base font-black shrink-0 {(allocations[
                  loser
                ] || 0) > 0
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-base-300 text-base-content/50'}"
              >
                🍺 {allocations[loser] || 0}
              </span>
            </div>

            <!-- Intuitive Slider with Quick Steppers -->
            <div class="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={availableTotal}
                step="1"
                value={allocations[loser] || 0}
                on:input={(e) =>
                  handleSliderChange(
                    loser,
                    parseInt(e.currentTarget.value) || 0,
                  )}
                class="range range-primary range-sm w-full cursor-pointer"
              />
            </div>
          </div>
        {/each}
      </div>

      <!-- Submit Button -->
      <button
        type="button"
        on:click={submitAllocations}
        disabled={totalAllocated < availableTotal}
        class="btn btn-primary btn-lg w-full font-black text-base uppercase tracking-wider shadow-lg cursor-pointer disabled:opacity-40"
      >
        SERVE {totalAllocated}
        {totalAllocated === 1 ? "DRINK" : "DRINKS"} ➔
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
      <h2 class="text-2xl font-black uppercase mt-2 mb-2">ORDER SENT</h2>
      <p class="text-xs text-base-content/70 font-semibold">
        Watch the pints fly into their trays on the TV!
      </p>
    </div>
  {/if}
</div>
