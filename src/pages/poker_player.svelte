<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";

  let m_data: any = {};
  $: m_data = $gameState.page_data || {};

  let isPeeking = false;
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

  // Automatic hand strength calculator to guide non-poker players
  function getHandQuality(hole: any[], comm: any[]): { badge: string; color: string } {
    if (!hole || hole.length < 2) return { badge: "❓ DEALT CARDS", color: "bg-gray-700" };
    const r1 = hole[0].rank;
    const r2 = hole[1].rank;
    const isPair = r1 === r2;
    const isHighCard = r1 >= 11 || r2 >= 11;

    // Check if hole matches community cards
    const commRanks = (comm || []).map((c) => c.rank);
    const matchesComm = commRanks.includes(r1) || commRanks.includes(r2);

    if (isPair || matchesComm) return { badge: "🔥 GREAT HAND!", color: "bg-emerald-600 text-white" };
    if (isHighCard) return { badge: "💪 DECENT HAND", color: "bg-blue-600 text-white" };
    return { badge: "🃏 WEAK / BLUFF", color: "bg-amber-600 text-white" };
  }

  function sendAction(actionType: "fold" | "call" | "raise") {
    if (hasSubmitted) return;
    hasSubmitted = true;
    const defaultRaiseAmt = m_data.minRaise || 100;
    gameClient.sendInput({
      type: "poker_action",
      action: actionType,
      raiseAmount: actionType === "raise" ? defaultRaiseAmt : 0,
    });
  }

  function togglePeek() {
    isPeeking = !isPeeking;
  }
</script>

<div class="poker-phone-container flex flex-col justify-between h-full w-full max-w-md mx-auto p-4 text-white font-sans select-none">
  <!-- Top Bar: Round & Pot Info -->
  <div class="flex justify-between items-center bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-yellow-500/30 shadow-lg">
    <div>
      <span class="text-xs uppercase font-extrabold text-yellow-400 tracking-wider">Round {m_data.round || 1}</span>
      <h2 class="text-sm font-bold text-gray-200">High Stakes Hold'em</h2>
    </div>
    <div class="text-right">
      <span class="text-xs text-emerald-400 font-semibold">POT</span>
      <div class="text-xl font-black text-yellow-400">${m_data.pot || 0}</div>
    </div>
  </div>

  <!-- Hand Quality Advice Pill for Non-Poker Players -->
  {#if m_data.holeCards && m_data.holeCards.length === 2}
    {@const hint = getHandQuality(m_data.holeCards, m_data.communityCards)}
    <div class="mx-auto my-1 px-4 py-1.5 rounded-full font-black text-xs tracking-wider shadow-md uppercase transition-all ${hint.color}">
      {hint.badge}
    </div>
  {/if}

  <!-- Pocket Cards Display -->
  <div class="my-2 flex flex-col items-center justify-center gap-2">
    <div
      class="relative w-full py-5 bg-emerald-950/60 rounded-3xl border-2 border-emerald-500/30 flex justify-center items-center gap-4 shadow-inner cursor-pointer"
      on:click={togglePeek}
    >
      {#if m_data.holeCards && m_data.holeCards.length === 2}
        {#each m_data.holeCards as card}
          <div
            class="w-24 h-36 rounded-2xl shadow-2xl flex flex-col justify-between p-2 font-black transition-all duration-300 transform"
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
                <span class="text-blue-300/70 text-xs font-extrabold uppercase tracking-widest">PEEK</span>
              </div>
            {/if}
          </div>
        {/each}
      {:else}
        <div class="text-gray-400 text-sm font-bold">Waiting for cards...</div>
      {/if}
    </div>

    <button
      type="button"
      class="text-xs text-emerald-300/80 font-extrabold uppercase tracking-wider underline cursor-pointer"
      on:click={togglePeek}
    >
      {isPeeking ? "Tap to Hide Cards" : "Tap to Peek Cards"}
    </button>
  </div>

  <!-- Intuitive 3-Choice Action Controls -->
  <div class="flex flex-col gap-3 mb-2">
    <div class="flex justify-between items-center px-4 py-2 bg-black/30 rounded-xl text-xs font-bold text-gray-300">
      <span>CHIPS: <strong class="text-emerald-400 text-sm">${m_data.playerChips || 0}</strong></span>
      <span>CURRENT BET: <strong class="text-yellow-400 text-sm">${m_data.playerBet || 0}</strong></span>
    </div>

    {#if m_data.folded}
      <div class="bg-red-950/80 border border-red-500/40 rounded-2xl p-4 text-center">
        <span class="text-red-400 font-extrabold text-lg block">FOLDED</span>
        <span class="text-xs text-gray-300">You dropped out. Watching the round play out!</span>
      </div>
    {:else if m_data.isMyTurn && !hasSubmitted}
      <div class="flex flex-col gap-2.5" in:scale={{ duration: 200 }}>
        <!-- Option 1: STAY IN / MATCH -->
        <button
          type="button"
          class="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 active:scale-95 font-black text-base rounded-2xl shadow-lg border border-emerald-400/30 uppercase tracking-wider flex items-center justify-center gap-2"
          on:click={() => sendAction("call")}
        >
          <span>🛡️ STAY IN (MATCH)</span>
        </button>

        <!-- Option 2: DOUBLE DOWN / RAISE -->
        <button
          type="button"
          class="w-full py-4 bg-gradient-to-r from-amber-500 to-purple-600 active:scale-95 font-black text-base rounded-2xl shadow-lg border border-amber-300/30 uppercase tracking-wider flex items-center justify-center gap-2"
          on:click={() => sendAction("raise")}
        >
          <span>🔥 DOUBLE DOWN (RAISE)</span>
        </button>

        <!-- Option 3: GIVE UP / FOLD -->
        <button
          type="button"
          class="w-full py-3 bg-red-900/80 hover:bg-red-800 active:scale-95 font-extrabold text-sm rounded-2xl border border-red-500/30 uppercase tracking-wider text-red-200"
          on:click={() => sendAction("fold")}
        >
          🚪 GIVE UP (FOLD)
        </button>
      </div>
    {:else}
      <!-- Waiting state -->
      <div class="bg-black/50 border border-emerald-500/30 rounded-2xl p-4 text-center flex flex-col items-center gap-2">
        <div class="w-7 h-7 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-bold text-gray-200">Move Submitted!</span>
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
