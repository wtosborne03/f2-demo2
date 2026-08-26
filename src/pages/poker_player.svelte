<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale, fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let m_data: any = {};
  $: m_data = $gameState.page_data || {};

  let lastPhase = "";
  let lastRound = 0;
  let lastCardCount = 0;
  let hasActed = false;

  $: if (m_data.phase !== lastPhase || m_data.round !== lastRound) {
    lastPhase = m_data.phase;
    lastRound = m_data.round;
    hasActed = false;
  }

  $: playerCards = m_data.playerCards || [];
  $: dealerUpcard = m_data.dealerVisibleCard || null;
  $: handValue = m_data.playerHandValue || { score: 0, display: "0", isSoft: false, isBlackjack: false, isBusted: false };
  $: strategy = m_data.strategyAdvice || { title: "Blackjack", description: "Get close to 21 without going over!", badgeColor: "bg-emerald-600" };
  $: isMyTurn = m_data.isMyTurn && !hasActed;
  $: canDouble = m_data.canDouble && isMyTurn;

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

  function isRed(suit: string): boolean {
    return suit === "hearts" || suit === "diamonds";
  }

  function sendAction(actionType: "hit" | "stand" | "double") {
    if (!isMyTurn) return;
    if (actionType === "stand" || actionType === "double") {
      hasActed = true;
    }
    gameClient.sendInput({
      type: "blackjack_action",
      action: actionType,
    });
  }
</script>

<div class="bj-phone-container flex flex-col justify-between h-full w-full max-w-md mx-auto p-3 text-white font-sans select-none box-border overflow-hidden">
  
  <!-- Top Header Bar -->
  <div class="flex justify-between items-center bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/30 shadow-lg">
    <div>
      <span class="text-[0.65rem] uppercase font-black text-amber-400 tracking-widest block">
        Round {m_data.round || 1} &bull; Blackjack 21
      </span>
      <div class="flex items-center gap-1.5 mt-0.5">
        <span class="text-xs font-bold text-gray-300">CHIPS:</span>
        <span class="text-sm font-black text-emerald-400">${m_data.playerChips || 0}</span>
      </div>
    </div>

    <div class="text-right">
      <span class="text-[0.65rem] uppercase font-bold text-amber-300/80 block">Current Bet</span>
      <div class="text-lg font-black text-amber-400">${m_data.currentBet || 100}</div>
    </div>
  </div>

  <!-- Dealer Upcard Radar Section -->
  <div class="my-1.5 bg-gradient-to-r from-emerald-950/70 via-black/80 to-emerald-950/70 border border-emerald-500/20 rounded-2xl p-2.5 flex items-center justify-between shadow-inner">
    <div class="flex flex-col">
      <span class="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider">Dealer's Visible Card</span>
      <span class="text-xs font-extrabold text-emerald-300">
        {#if dealerUpcard}
          Dealer Shows: {displayRanks[dealerUpcard.rank] || dealerUpcard.rank} {suitSymbols[dealerUpcard.suit] || dealerUpcard.suit}
        {:else}
          Waiting for deal...
        {/if}
      </span>
    </div>

    {#if dealerUpcard}
      <div
        class="w-10 h-14 bg-white rounded-lg shadow-md flex flex-col justify-between p-1 font-black leading-none"
        class:text-red-600={isRed(dealerUpcard.suit)}
        class:text-gray-900={!isRed(dealerUpcard.suit)}
        in:scale={{ duration: 250 }}
      >
        <span class="text-[0.65rem]">{displayRanks[dealerUpcard.rank] || dealerUpcard.rank}</span>
        <span class="text-base text-center">{suitSymbols[dealerUpcard.suit] || dealerUpcard.suit}</span>
        <span class="text-[0.65rem] self-end rotate-180">{displayRanks[dealerUpcard.rank] || dealerUpcard.rank}</span>
      </div>
    {/if}
  </div>

  <!-- Beginner Strategy Advisor Pill -->
  <div
    class="mx-auto w-full px-3 py-2 rounded-2xl border border-white/10 shadow-lg transition-all duration-300 flex items-start gap-2.5 {strategy.badgeColor || 'bg-emerald-800'}"
    in:fly={{ y: -8, duration: 200 }}
  >
    <span class="text-lg">💡</span>
    <div class="flex flex-col flex-1">
      <span class="text-xs font-black uppercase tracking-wider text-white">
        {strategy.title}
      </span>
      <span class="text-[0.72rem] font-semibold text-emerald-50/90 leading-tight mt-0.5">
        {strategy.description}
      </span>
    </div>
  </div>

  <!-- Player's Cards Fan & Total Display -->
  <div class="my-auto py-2 flex flex-col items-center justify-center">
    
    <!-- Hand Score Indicator -->
    <div class="mb-2">
      {#if handValue.isBlackjack}
        <div class="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-sm uppercase tracking-wider rounded-full shadow-lg border-2 border-white animate-bounce">
          👑 Natural Blackjack 21!
        </div>
      {:else if handValue.isBusted}
        <div class="px-4 py-1 bg-red-600 text-white font-black text-sm uppercase tracking-wider rounded-full shadow-lg border border-red-300 animate-pulse">
          💥 BUSTED ({handValue.score})
        </div>
      {:else if handValue.score > 0}
        <div class="px-4 py-1 bg-emerald-600/90 text-white font-black text-sm tracking-wider rounded-full shadow-md border border-emerald-400 flex items-center gap-2">
          <span>HAND TOTAL:</span>
          <span class="text-base text-yellow-300">{handValue.display}</span>
        </div>
      {/if}
    </div>

    <!-- Cards Layout -->
    <div class="flex flex-wrap justify-center items-center gap-2 max-w-full px-2">
      {#if playerCards && playerCards.length > 0}
        {#each playerCards as card, idx (idx)}
          <div
            class="w-18 h-26 sm:w-20 sm:h-28 bg-white rounded-xl shadow-2xl flex flex-col justify-between p-1.5 font-black transition-all duration-300 transform"
            class:text-red-600={isRed(card.suit)}
            class:text-gray-950={!isRed(card.suit)}
            in:scale={{ duration: 220, start: 0.7, easing: cubicOut }}
          >
            <div class="flex justify-between items-start leading-none">
              <span class="text-sm font-black">{displayRanks[card.rank] || card.rank}</span>
              <span class="text-xs">{suitSymbols[card.suit] || card.suit}</span>
            </div>
            
            <div class="text-3xl text-center leading-none">
              {suitSymbols[card.suit] || card.suit}
            </div>

            <div class="flex justify-between items-end leading-none self-end rotate-180">
              <span class="text-sm font-black">{displayRanks[card.rank] || card.rank}</span>
              <span class="text-xs">{suitSymbols[card.suit] || card.suit}</span>
            </div>
          </div>
        {/each}
      {:else}
        <div class="h-28 flex items-center justify-center text-emerald-400 font-bold text-sm animate-pulse">
          Dealing your cards from the shoe...
        </div>
      {/if}
    </div>
  </div>

  <!-- Interactive Controls / Status -->
  <div class="flex flex-col gap-2 mb-1">
    
    {#if m_data.outcome}
      <!-- Showdown Outcome Banner -->
      <div
        class="rounded-2xl p-3 text-center border shadow-xl flex flex-col items-center justify-center gap-1"
        class:bg-amber-500={m_data.outcome === 'blackjack'}
        class:text-black={m_data.outcome === 'blackjack'}
        class:bg-emerald-700={m_data.outcome === 'win'}
        class:text-white={m_data.outcome === 'win'}
        class:bg-slate-700={m_data.outcome === 'push'}
        class:bg-red-900={m_data.outcome === 'loss' || m_data.outcome === 'bust'}
        in:scale={{ duration: 250 }}
      >
        <span class="text-base font-black uppercase tracking-wider">
          {#if m_data.outcome === 'blackjack'}
            👑 BLACKJACK! Won +${m_data.netWon}
          {:else if m_data.outcome === 'win'}
            🏆 YOU WON! +${m_data.netWon}
          {:else if m_data.outcome === 'push'}
            🤝 PUSH (TIE) - Bet Returned
          {:else if m_data.outcome === 'bust'}
            💥 BUSTED - Lost ${m_data.currentBet}
          {:else}
            ❌ HOUSE WINS - Lost ${m_data.currentBet}
          {/if}
        </span>
        <span class="text-[0.7rem] font-semibold opacity-90">
          Tournament points recorded on the CouchCup leaderboard!
        </span>
      </div>

    {:else if isMyTurn}
      <!-- Active Decisions -->
      <div class="grid grid-cols-2 gap-2" in:scale={{ duration: 180 }}>
        <!-- Option 1: HIT (Take Card) -->
        <button
          type="button"
          class="py-3.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 active:scale-95 active:bg-emerald-700 font-black text-sm rounded-2xl shadow-lg border border-emerald-400/40 uppercase tracking-wider flex flex-col items-center justify-center cursor-pointer transition-transform"
          on:click={() => sendAction("hit")}
        >
          <span class="text-base">🟢 HIT</span>
          <span class="text-[0.65rem] text-emerald-100 font-semibold mt-0.5">Take +1 Card</span>
        </button>

        <!-- Option 2: STAND (Hold) -->
        <button
          type="button"
          class="py-3.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-95 active:bg-blue-700 font-black text-sm rounded-2xl shadow-lg border border-blue-400/40 uppercase tracking-wider flex flex-col items-center justify-center cursor-pointer transition-transform"
          on:click={() => sendAction("stand")}
        >
          <span class="text-base">🛑 STAND</span>
          <span class="text-[0.65rem] text-blue-100 font-semibold mt-0.5">Keep Hand</span>
        </button>
      </div>

      <!-- Option 3: DOUBLE DOWN (if eligible) -->
      {#if canDouble}
        <button
          type="button"
          class="w-full py-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 active:scale-95 font-black text-xs rounded-2xl shadow-lg border border-purple-300/40 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-transform"
          on:click={() => sendAction("double")}
          in:fly={{ y: 10, duration: 200 }}
        >
          <span>⚡ DOUBLE DOWN (${m_data.currentBet * 2}) &bull; Draw 1 Final Card</span>
        </button>
      {/if}

    {:else if handValue.isBusted}
      <!-- Busted State -->
      <div class="bg-red-950/80 border border-red-500/40 rounded-2xl p-3 text-center">
        <span class="text-red-400 font-black text-base block">💥 BUSTED AT {handValue.score}</span>
        <span class="text-[0.72rem] text-gray-300">Total exceeded 21. Watching dealer play!</span>
      </div>

    {:else if handValue.isBlackjack}
      <!-- Natural 21 State -->
      <div class="bg-amber-950/80 border border-amber-400/50 rounded-2xl p-3 text-center">
        <span class="text-amber-300 font-black text-base block">👑 21 LOCKED IN</span>
        <span class="text-[0.72rem] text-gray-300">Natural Blackjack! Waiting for dealer reveal.</span>
      </div>

    {:else}
      <!-- Waiting / Locked In State -->
      <div class="bg-black/60 border border-emerald-500/30 rounded-2xl p-3 text-center flex items-center justify-center gap-3">
        <div class="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <div class="flex flex-col text-left">
          <span class="text-xs font-black text-gray-200">{m_data.status || "Move Locked In!"}</span>
          <span class="text-[0.68rem] text-gray-400">Waiting for other players & the dealer...</span>
        </div>
      </div>
    {/if}
  </div>

</div>

<style>
  :global(body:has(.bj-phone-container)) {
    background-color: #041208 !important;
  }
  :global(#main-background:has(.bj-phone-container)) {
    background-color: #041208 !important;
    padding: 0 !important;
  }
</style>
