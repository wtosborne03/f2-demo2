<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale, fade } from "svelte/transition";

  let m_data: any = {};
  $: m_data = $gameState.page_data || {};

  let isPeeking = false;
  let raiseAmount = 50;
  let hasSubmitted = false;

  const suitSymbols: Record<string, string> = {
    spades: "♠",
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
  };

  const displayRanks: Record<number, string> = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  };

  function sendAction(actionType: "fold" | "call" | "raise" | "allin", amount?: number) {
    if (hasSubmitted) return;
    hasSubmitted = true;
    gameClient.sendInput({
      type: "poker_action",
      action: actionType,
      raiseAmount: amount || raiseAmount,
    });
  }

  function startPeek() {
    isPeeking = true;
  }

  function endPeek() {
    isPeeking = false;
  }
</script>

<div class="poker-phone-container flex flex-col justify-between h-full w-full max-w-md mx-auto p-4 text-white font-sans select-none">
  <!-- Top Bar: Round info & Pot -->
  <div class="flex justify-between items-center bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-yellow-500/30 shadow-lg">
    <div>
      <span class="text-xs uppercase font-extrabold text-yellow-400 tracking-wider">Round {m_data.round || 1}</span>
      <h2 class="text-sm font-bold text-gray-200">{m_data.statusText || "High Stakes Poker"}</h2>
    </div>
    <div class="text-right">
      <span class="text-xs text-emerald-400 font-semibold">POT</span>
      <div class="text-xl font-black text-yellow-400">${m_data.pot || 0}</div>
    </div>
  </div>

  <!-- Central Card View & Peek Mechanism -->
  <div class="my-4 flex flex-col items-center justify-center gap-3">
    <div class="text-center text-xs font-semibold text-emerald-300/80">
      {#if isPeeking}
        <span>👀 POCKET CARDS REVEALED</span>
      {:else}
        <span>🔒 PRESS & HOLD BELOW TO PEEK CARDS</span>
      {/if}
    </div>

    <!-- Hole Cards Display Container -->
    <div
      class="relative w-full py-6 bg-emerald-950/60 rounded-3xl border-2 border-emerald-500/30 flex justify-center items-center gap-4 shadow-inner cursor-pointer"
      on:pointerdown={startPeek}
      on:pointerup={endPeek}
      on:pointerleave={endPeek}
    >
      {#if m_data.holeCards && m_data.holeCards.length === 2}
        {#each m_data.holeCards as card}
          <div
            class="w-24 h-36 rounded-2xl shadow-2xl flex flex-col justify-between p-2 font-black transition-transform duration-300 ease-out transform"
            class:rotate-y-180={!isPeeking}
            style="background: {isPeeking ? '#ffffff' : 'linear-gradient(135deg, #1e3a8a, #0f172a)'}; border: {isPeeking ? 'none' : '2px solid #60a5fa'};"
          >
            {#if isPeeking}
              <div class="text-lg leading-none" class:text-red-600={card.suit === 'hearts' || card.suit === 'diamonds'} class:text-gray-900={card.suit === 'spades' || card.suit === 'clubs'}>
                {displayRanks[card.rank] || card.rank}
              </div>
              <div class="text-4xl text-center leading-none" class:text-red-600={card.suit === 'hearts' || card.suit === 'diamonds'} class:text-gray-900={card.suit === 'spades' || card.suit === 'clubs'}>
                {suitSymbols[card.suit] || card.suit}
              </div>
              <div class="text-lg leading-none self-end rotate-180" class:text-red-600={card.suit === 'hearts' || card.suit === 'diamonds'} class:text-gray-900={card.suit === 'spades' || card.suit === 'clubs'}>
                {displayRanks[card.rank] || card.rank}
              </div>
            {:else}
              <div class="w-full h-full border border-blue-400/40 rounded-xl flex items-center justify-center">
                <span class="text-blue-300/60 text-xs font-bold uppercase tracking-widest">PEEK</span>
              </div>
            {/if}
          </div>
        {/each}
      {:else}
        <div class="text-gray-400 text-sm font-bold">Waiting for cards...</div>
      {/if}
    </div>

    <!-- Hold to Peek Button -->
    <button
      type="button"
      class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-extrabold rounded-2xl shadow-md text-sm tracking-wider uppercase"
      on:pointerdown={startPeek}
      on:pointerup={endPeek}
      on:pointerleave={endPeek}
    >
      {isPeeking ? "Release to Hide" : "Hold to Peek Cards"}
    </button>
  </div>

  <!-- Player Stats & Controls Area -->
  <div class="flex flex-col gap-3">
    <!-- Balance & Current Bet -->
    <div class="flex justify-between items-center px-4 py-2 bg-black/30 rounded-xl text-xs font-bold text-gray-300">
      <span>YOUR CHIPS: <strong class="text-emerald-400 text-sm">${m_data.playerChips || 0}</strong></span>
      <span>CURRENT BET: <strong class="text-yellow-400 text-sm">${m_data.playerBet || 0}</strong></span>
    </div>

    {#if m_data.folded}
      <div class="bg-red-950/80 border border-red-500/40 rounded-2xl p-4 text-center">
        <span class="text-red-400 font-extrabold text-lg block">HAND FOLDED</span>
        <span class="text-xs text-gray-300">You are out for this round. Sit back and watch!</span>
      </div>
    {:else if m_data.isMyTurn && !hasSubmitted}
      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-3" in:scale={{ duration: 250 }}>
        <!-- Fold Button -->
        <button
          type="button"
          class="py-4 bg-gradient-to-r from-red-700 to-red-600 active:scale-95 font-black text-lg rounded-2xl shadow-lg border border-red-400/30 uppercase tracking-wider"
          on:click={() => sendAction("fold")}
        >
          FOLD
        </button>

        <!-- Check / Call Button -->
        <button
          type="button"
          class="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 active:scale-95 font-black text-lg rounded-2xl shadow-lg border border-emerald-400/30 uppercase tracking-wider"
          on:click={() => sendAction("call")}
        >
          CHECK / CALL
        </button>
      </div>

      <!-- Raise / All-in Controls -->
      <div class="bg-purple-950/60 border border-purple-500/40 rounded-2xl p-3 flex flex-col gap-2 shadow-lg">
        <div class="flex justify-between items-center text-xs font-bold text-purple-200">
          <span>RAISE AMOUNT</span>
          <span class="text-yellow-400 text-base font-black">${raiseAmount}</span>
        </div>

        <input
          type="range"
          min={m_data.minRaise || 50}
          max={m_data.maxRaise || 500}
          step="50"
          bind:value={raiseAmount}
          class="w-full accent-purple-400 cursor-pointer"
        />

        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 py-2 bg-purple-800 hover:bg-purple-700 text-xs font-extrabold rounded-xl"
            on:click={() => (raiseAmount = Math.min(m_data.maxRaise || 500, raiseAmount + 50))}
          >
            +$50
          </button>
          <button
            type="button"
            class="flex-1 py-2 bg-purple-800 hover:bg-purple-700 text-xs font-extrabold rounded-xl"
            on:click={() => (raiseAmount = Math.min(m_data.maxRaise || 500, raiseAmount + 100))}
          >
            +$100
          </button>
          <button
            type="button"
            class="flex-1 py-2 bg-gradient-to-r from-amber-600 to-yellow-500 text-xs font-black rounded-xl text-black"
            on:click={() => sendAction("allin")}
          >
            ALL IN!
          </button>
        </div>

        <button
          type="button"
          class="w-full py-3 mt-1 bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-sm uppercase rounded-xl shadow-md border border-purple-400/40"
          on:click={() => sendAction("raise", raiseAmount)}
        >
          CONFIRM RAISE (${raiseAmount})
        </button>
      </div>
    {:else}
      <!-- Waiting state -->
      <div class="bg-black/50 border border-emerald-500/30 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
        <div class="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-bold text-gray-200">Action Locked In!</span>
        <span class="text-xs text-gray-400">Waiting for other players on the couch...</span>
      </div>
    {/if}
  </div>
</div>

<style>
  :global(body:has(.poker-phone-container)) {
    background-color: #061a0d !important;
  }
  :global(#main-background:has(.poker-phone-container)) {
    background-color: #061a0d !important;
    padding: 0 !important;
  }
</style>
