<script lang="ts">
  import { get } from "svelte/store";
  import type { VoteData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: VoteData;
  m_data = get(gameState).page_data;

  let selectedIndex: number | null = null;

  const COLOR_PALETTE = [
    '#00f0ff', // Cyan
    '#ffe600', // Yellow
    '#a3e635', // Lime
    '#ff007f', // Hot Pink
    '#ff6b00', // Orange
    '#c084fc', // Lavender
  ];

  function submit_answer(index: number) {
    if (selectedIndex !== null) return;
    selectedIndex = index;
    gameClient.sendPlayerInput("playerVoteData", {
      answer: m_data.options[index],
    });
  }
</script>

<div class="flex flex-col justify-center items-center min-h-full w-full max-w-lg mx-auto px-4 py-6 text-center select-none animate-in fade-in duration-200">
  <!-- Header Banner -->
  <div class="inline-flex items-center gap-2 px-4 py-1 mb-4 bg-black text-[#ffe600] font-black text-xs uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_#000000] -rotate-1 rounded-sm">
    <span>🗳</span>
    <span>VOTE FOR THE BEST ANSWER</span>
  </div>

  <div class="w-full flex flex-col gap-3.5">
    {#each m_data.options as answer, index}
      {@const isSelected = selectedIndex === index}
      {@const bg = COLOR_PALETTE[index % COLOR_PALETTE.length]}
      <button
        type="button"
        disabled={selectedIndex !== null && !isSelected}
        class="w-full py-4 px-5 border-4 border-black rounded-xl font-black text-lg sm:text-xl uppercase tracking-tight text-black text-left shadow-[5px_5px_0px_#000000] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-between {isSelected ? 'ring-4 ring-black bg-[#00ff66] translate-x-1 translate-y-1 shadow-[2px_2px_0px_#000000]' : 'active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000000]'}"
        style="background-color: {isSelected ? '#00ff66' : bg};"
        onclick={() => submit_answer(index)}
      >
        <span class="truncate pr-2">"{answer}"</span>
        {#if isSelected}
          <span class="px-2 py-0.5 bg-black text-[#00ff66] font-mono font-black text-xs uppercase rounded">VOTED ✓</span>
        {:else}
          <span class="px-2 py-0.5 bg-black text-white font-mono font-black text-xs uppercase rounded">VOTE</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if selectedIndex !== null}
    <div class="mt-6 px-4 py-2 bg-black text-[#ffe600] font-black text-xs uppercase tracking-widest rounded border-2 border-black shadow-[4px_4px_0px_#000000]">
      VOTE RECORDED! LOOK AT THE TV
    </div>
  {/if}
</div>
