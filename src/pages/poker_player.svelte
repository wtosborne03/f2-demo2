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

<div class="flex flex-col justify-between items-center w-full max-w-sm mx-auto h-full p-4 select-none gap-3">
  
  <!-- Top Bar: Dealer Upcard & Bet Info -->
  <div class="card bg-base-200 border border-base-300 w-full p-3 shadow-sm flex-row items-center justify-between">
    <div class="flex items-center gap-2.5">
      <div class="text-xs font-bold opacity-70">DEALER:</div>
      {#if dealerUpcard}
        <div class="badge badge-lg gap-1.5 font-bold {isRed(dealerUpcard.suit) ? 'badge-error text-white' : 'badge-neutral'}">
          <span>{displayRanks[dealerUpcard.rank] || dealerUpcard.rank}</span>
          <span>{suitSymbols[dealerUpcard.suit] || dealerUpcard.suit}</span>
        </div>
      {:else}
        <div class="badge badge-ghost badge-sm">Dealing...</div>
      {/if}
    </div>

    <div class="text-right flex items-center gap-1.5">
      <span class="text-xs opacity-60">BET:</span>
      <span class="badge badge-primary badge-lg font-black">${m_data.currentBet || 100}</span>
    </div>
  </div>

  <!-- Cards Area -->
  <div class="card bg-base-200 border border-base-300 w-full p-4 flex flex-col items-center justify-center gap-3 my-auto shadow-sm">
    
    <!-- Hand Total -->
    <div class="flex items-center justify-center">
      {#if handValue.isBlackjack}
        <div class="badge badge-warning badge-lg font-black text-sm px-4 py-3 animate-bounce">
          👑 21 BLACKJACK!
        </div>
      {:else if handValue.isBusted}
        <div class="badge badge-error badge-lg font-black text-sm text-white px-4 py-3">
          💥 BUSTED ({handValue.score})
        </div>
      {:else if handValue.score > 0}
        <div class="badge badge-neutral badge-lg font-bold text-sm px-4 py-3 gap-2">
          <span class="opacity-70">TOTAL:</span>
          <span class="text-primary font-black text-base">{handValue.display}</span>
        </div>
      {/if}
    </div>

    <!-- Cards Display -->
    <div class="flex flex-wrap justify-center items-center gap-2 min-h-28">
      {#if playerCards.length > 0}
        {#each playerCards as card, idx (idx)}
          <div
            class="w-18 h-26 bg-white rounded-xl shadow-md border border-gray-200 flex flex-col justify-between p-1.5 font-black leading-none"
            class:text-red-600={isRed(card.suit)}
            class:text-gray-900={!isRed(card.suit)}
            in:scale={{ duration: 180 }}
          >
            <span class="text-sm">{displayRanks[card.rank] || card.rank}</span>
            <span class="text-3xl text-center">{suitSymbols[card.suit] || card.suit}</span>
            <span class="text-sm self-end rotate-180">{displayRanks[card.rank] || card.rank}</span>
          </div>
        {/each}
      {:else}
        <span class="loading loading-spinner loading-md text-primary"></span>
      {/if}
    </div>

    <!-- Simple Strategy Tip -->
    {#if strategy && strategy.description && isMyTurn}
      <div class="text-xs text-center opacity-80 font-medium px-2 py-1 bg-base-300/50 rounded-lg w-full" in:fade>
        💡 {strategy.description}
      </div>
    {/if}
  </div>

  <!-- Bottom Actions -->
  <div class="w-full flex flex-col gap-2">
    {#if m_data.outcome}
      <!-- Showdown Result -->
      <div
        class="alert shadow-sm text-center justify-center font-black text-base py-3"
        class:alert-success={m_data.outcome === 'win' || m_data.outcome === 'blackjack'}
        class:alert-info={m_data.outcome === 'push'}
        class:alert-error={m_data.outcome === 'loss' || m_data.outcome === 'bust'}
      >
        <span>
          {#if m_data.outcome === 'blackjack'}
            👑 Blackjack! +${m_data.netWon}
          {:else if m_data.outcome === 'win'}
            🏆 Won +${m_data.netWon}
          {:else if m_data.outcome === 'push'}
            🤝 Push (Tie)
          {:else if m_data.outcome === 'bust'}
            💥 Busted (-${m_data.currentBet})
          {:else}
            ❌ Lost (-${m_data.currentBet})
          {/if}
        </span>
      </div>

    {:else if isMyTurn}
      <!-- Action Buttons -->
      <div class="flex gap-3 w-full">
        <button
          type="button"
          class="btn btn-success btn-lg flex-1 text-lg font-black text-white"
          onclick={() => sendAction("hit")}
        >
          HIT
        </button>

        <button
          type="button"
          class="btn btn-error btn-lg flex-1 text-lg font-black text-white"
          onclick={() => sendAction("stand")}
        >
          STAND
        </button>
      </div>

      {#if canDouble}
        <button
          type="button"
          class="btn btn-warning btn-md w-full font-bold"
          onclick={() => sendAction("double")}
        >
          ⚡ Double Down (${m_data.currentBet * 2})
        </button>
      {/if}

    {:else if handValue.isBusted}
      <div class="alert alert-error text-center justify-center font-bold text-sm py-3 text-white">
        Busted! Waiting for dealer...
      </div>

    {:else}
      <div class="card bg-base-200 border border-base-300 p-3 text-center flex-row items-center justify-center gap-2 shadow-sm">
        <span class="loading loading-spinner loading-sm text-primary"></span>
        <span class="text-sm font-semibold opacity-80">{m_data.status || "Waiting for table..."}</span>
      </div>
    {/if}
  </div>

</div>
