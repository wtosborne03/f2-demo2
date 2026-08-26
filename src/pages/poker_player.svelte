<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale, fade } from "svelte/transition";

  let m_data: any = {};
  $: m_data = $gameState.page_data || {};

  let lastPhase = "";
  let lastRound = 0;
  let hasActed = false;

  $: if (m_data.phase !== lastPhase || m_data.round !== lastRound) {
    lastPhase = m_data.phase;
    lastRound = m_data.round;
    hasActed = false;
  }

  $: playerCards = m_data.playerCards || [];
  $: dealerUpcard = m_data.dealerVisibleCard || null;
  $: handValue = m_data.playerHandValue || { score: 0, display: "0", isSoft: false, isBlackjack: false, isBusted: false };
  $: strategy = m_data.strategyAdvice || { title: "Blackjack", description: "", badgeColor: "" };
  $: isMyTurn = m_data.isMyTurn && !hasActed;
  $: canDouble = m_data.canDouble && isMyTurn;

  // Responsive grid and typography sizing based on card count
  $: cardLayout = playerCards.length <= 2
    ? {
        gridCols: "grid-cols-2 max-w-[340px] gap-4",
        cardWidth: "w-36 sm:w-40",
        rankFont: "text-2xl sm:text-3xl",
        suitFont: "text-base sm:text-lg",
        centerFont: "text-5xl sm:text-6xl",
        padding: "p-3 sm:p-3.5",
      }
    : playerCards.length <= 4
      ? {
          gridCols: "grid-cols-2 max-w-[300px] gap-2.5 sm:gap-3",
          cardWidth: "w-30 sm:w-34",
          rankFont: "text-xl sm:text-2xl",
          suitFont: "text-sm sm:text-base",
          centerFont: "text-4xl sm:text-5xl",
          padding: "p-2.5 sm:p-3",
        }
      : {
          gridCols: "grid-cols-3 max-w-[340px] gap-2",
          cardWidth: "w-24 sm:w-26",
          rankFont: "text-lg sm:text-xl",
          suitFont: "text-xs sm:text-sm",
          centerFont: "text-3xl sm:text-4xl",
          padding: "p-2",
        };

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

<div class="flex flex-col justify-between items-center w-full max-w-md mx-auto h-full p-3 sm:p-4 select-none gap-2.5 box-border overflow-hidden">
  
  <!-- Top Bar: Dealer Upcard & Bet Info -->
  <div class="card bg-base-200/90 backdrop-blur-sm border border-base-300 w-full px-4 py-3 shadow-sm flex-row items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <span class="text-xs font-black tracking-wider opacity-70">DEALER:</span>
      {#if dealerUpcard}
        <div class="badge badge-lg gap-2 font-black py-3 px-3.5 {isRed(dealerUpcard.suit) ? 'badge-error text-white' : 'badge-neutral'}">
          <span class="text-base font-black">{displayRanks[dealerUpcard.rank] || dealerUpcard.rank}</span>
          <span class="text-lg">{suitSymbols[dealerUpcard.suit] || dealerUpcard.suit}</span>
        </div>
      {:else}
        <div class="badge badge-ghost badge-sm">Dealing...</div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs font-black tracking-wider opacity-70">BET:</span>
      <span class="badge badge-primary badge-lg font-black text-sm py-3 px-3.5">${m_data.currentBet || 100}</span>
    </div>
  </div>

  <!-- Main Cards & Score Arena (Fills Space with Preserved Aspect Ratio) -->
  <div class="card bg-base-200/90 backdrop-blur-sm border border-base-300 w-full flex-1 p-3 sm:p-4 flex flex-col items-center justify-between shadow-sm min-h-0 overflow-y-auto">
    
    <!-- Total Score Pill (Top of Card Area) -->
    <div class="shrink-0 mb-1">
      {#if handValue.isBlackjack}
        <div class="badge badge-warning badge-lg font-black text-base px-6 py-4 shadow-md animate-bounce">
          👑 21 BLACKJACK!
        </div>
      {:else if handValue.isBusted}
        <div class="badge badge-error badge-lg font-black text-base text-white px-6 py-4 shadow-md">
          💥 BUSTED ({handValue.score})
        </div>
      {:else if handValue.score > 0}
        <div class="badge badge-neutral badge-lg font-black text-base px-6 py-4 gap-2.5 shadow-md">
          <span class="opacity-70 text-xs tracking-wider">TOTAL:</span>
          <span class="text-primary font-black text-xl">{handValue.display}</span>
        </div>
      {/if}
    </div>

    <!-- Cards Grid (Preserves Aspect Ratio, Multi-row for 3+ cards) -->
    <div class="flex-1 w-full flex items-center justify-center my-auto py-1">
      {#if playerCards.length > 0}
        <div class="grid {cardLayout.gridCols} w-full justify-items-center items-center">
          {#each playerCards as card, idx (idx)}
            <div
              class="{cardLayout.cardWidth} aspect-[5/7] bg-white rounded-2xl shadow-xl border-2 border-gray-100 flex flex-col justify-between {cardLayout.padding} font-black leading-none transition-all transform"
              class:text-red-600={isRed(card.suit)}
              class:text-gray-900={!isRed(card.suit)}
              in:scale={{ duration: 200 }}
            >
              <!-- Top Corner Index: Extra Large Number + Suit -->
              <div class="flex items-start justify-between leading-none">
                <span class="{cardLayout.rankFont} font-black tracking-tight">{displayRanks[card.rank] || card.rank}</span>
                <span class="{cardLayout.suitFont} mt-0.5">{suitSymbols[card.suit] || card.suit}</span>
              </div>
              
              <!-- Giant Center Suit -->
              <div class="{cardLayout.centerFont} text-center leading-none my-auto">
                {suitSymbols[card.suit] || card.suit}
              </div>

              <!-- Bottom Corner Index (Inverted) -->
              <div class="flex items-end justify-between leading-none rotate-180">
                <span class="{cardLayout.rankFont} font-black tracking-tight">{displayRanks[card.rank] || card.rank}</span>
                <span class="{cardLayout.suitFont} mt-0.5">{suitSymbols[card.suit] || card.suit}</span>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <span class="text-sm font-bold opacity-70">Dealing your cards...</span>
        </div>
      {/if}
    </div>

    <!-- Strategy Advice Tip (Bottom of Card Area) -->
    {#if strategy && strategy.description && isMyTurn}
      <div class="shrink-0 w-full mt-1.5" in:fade>
        <div class="text-xs sm:text-sm text-center font-bold px-3 py-1.5 bg-base-300/70 border border-base-300 rounded-xl">
          💡 {strategy.description}
        </div>
      </div>
    {/if}
  </div>

  <!-- Bottom Actions (Large, Full-Width, Easy to Tap) -->
  <div class="w-full flex flex-col gap-2 shrink-0">
    {#if m_data.outcome}
      <!-- Showdown Outcome Banner -->
      <div
        class="alert shadow-md text-center justify-center font-black text-lg py-3.5 rounded-2xl"
        class:alert-success={m_data.outcome === 'win' || m_data.outcome === 'blackjack'}
        class:alert-info={m_data.outcome === 'push'}
        class:alert-error={m_data.outcome === 'loss' || m_data.outcome === 'bust'}
      >
        <span>
          {#if m_data.outcome === 'blackjack'}
            👑 Blackjack! +${m_data.netWon}
          {:else if m_data.outcome === 'win'}
            🏆 You Won! +${m_data.netWon}
          {:else if m_data.outcome === 'push'}
            🤝 Push (Tie)
          {:else if m_data.outcome === 'bust'}
            💥 Busted (-${m_data.currentBet})
          {:else}
            ❌ House Wins (-${m_data.currentBet})
          {/if}
        </span>
      </div>

    {:else if isMyTurn}
      <!-- Main Hit & Stand Buttons (Extra Large & Bold) -->
      <div class="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          class="btn btn-success h-16 sm:h-18 text-xl sm:text-2xl font-black text-white rounded-2xl shadow-lg border-2 border-emerald-400/40 active:scale-95 transition-transform"
          onclick={() => sendAction("hit")}
        >
          🟢 HIT
        </button>

        <button
          type="button"
          class="btn btn-error h-16 sm:h-18 text-xl sm:text-2xl font-black text-white rounded-2xl shadow-lg border-2 border-red-400/40 active:scale-95 transition-transform"
          onclick={() => sendAction("stand")}
        >
          🛑 STAND
        </button>
      </div>

      <!-- Double Down Button (Full Width Bar) -->
      {#if canDouble}
        <button
          type="button"
          class="btn btn-warning h-11 text-sm sm:text-base font-black w-full rounded-2xl shadow-md active:scale-95 transition-transform"
          onclick={() => sendAction("double")}
        >
          ⚡ Double Down (${m_data.currentBet * 2})
        </button>
      {/if}

    {:else if handValue.isBusted}
      <div class="alert alert-error text-center justify-center font-bold text-base py-3.5 text-white rounded-2xl shadow-md">
        💥 Busted! Watching the dealer play...
      </div>

    {:else}
      <div class="card bg-base-200/90 border border-base-300 p-3.5 text-center flex-row items-center justify-center gap-3 shadow-md rounded-2xl">
        <span class="loading loading-spinner loading-md text-primary"></span>
        <span class="text-sm sm:text-base font-bold opacity-80">{m_data.status || "Waiting for other players..."}</span>
      </div>
    {/if}
  </div>

</div>
