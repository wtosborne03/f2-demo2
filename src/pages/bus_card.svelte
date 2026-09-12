<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Card from "$lib/components/card.svelte";
  import type { BusData } from "../types/page_data";
  import { get } from "svelte/store";
  import Drink from "$lib/components/drink.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  import { fade, scale, fly, slide } from "svelte/transition";
  import { bounceOut, elasticOut } from "svelte/easing";
  import Icon from "@iconify/svelte";

  let m_data: BusData;
  m_data = get(gameState).page_data;

  interface Card {
    color: "red" | "black";
    value:
      | "2"
      | "3"
      | "4"
      | "5"
      | "6"
      | "7"
      | "8"
      | "9"
      | "10"
      | "J"
      | "Q"
      | "K"
      | "A";
    type: "♠️" | "♣️" | "♦️" | "♥️";
    flipped: boolean;
  }

  function getRandomCard(): Card {
    const colors = ["red", "black"] as const;
    const values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ] as const;
    const types = ["♠️", "♣️", "♦️", "♥️"] as const;

    const randomValue = values[Math.floor(Math.random() * values.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      color: randomType == "♦️" || randomType == "♥️" ? colors[0] : colors[1],
      value: randomValue,
      type: randomType,
      flipped: false, // Card will stay face down at start
    };
  }

  function compareCardValues(card1: Card, card2: Card): number {
    const valueOrder: Card["value"][] = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];

    const index1 = valueOrder.indexOf(card1.value);
    const index2 = valueOrder.indexOf(card2.value);

    if (index1 < index2) {
      return -1; // card1 is lower than card2
    } else if (index1 > index2) {
      return 1; // card1 is higher than card2
    } else {
      return 0; // card1 and card2 have the same value
    }
  }

  function isCardOutsideOrInBetween(
    cardToCheck: Card,
    card1: Card,
    card2: Card,
  ): "outside" | "inBetween" | "equal" {
    const comparison1 = compareCardValues(cardToCheck, card1);
    const comparison2 = compareCardValues(cardToCheck, card2);

    if (comparison1 === 0 || comparison2 === 0) {
      return "equal"; // cardToCheck is equal to one of the boundary cards
    } else if (
      (comparison1 < 0 && comparison2 > 0) ||
      (comparison1 > 0 && comparison2 < 0)
    ) {
      return "inBetween"; // cardToCheck is in between card1 and card2
    } else {
      return "outside"; // cardToCheck is outside the range of card1 and card2
    }
  }

  let cards: Card[] = [];
  let round_progress = 0;
  let failed = false;
  let canContinue = false;
  let showSuccess = false;

  let timeouts: any[] = [];

  const broadcastDeck = (customCards?: Card[], customRound?: number, isFailed?: boolean) => {
    try {
      const activeCards = (customCards || cards).map((c) => ({
        color: c.color,
        value: c.value,
        type: c.type,
        flipped: c.flipped,
      }));
      gameClient.sendPlayerInput("bus_cards", {
        cards: activeCards,
        round_progress: customRound !== undefined ? customRound : round_progress,
        failed: isFailed !== undefined ? isFailed : failed,
      });
    } catch (e) {
      console.warn("Error broadcasting bus cards:", e);
    }
  };

  const failRound = () => {
    broadcastDeck(cards, round_progress, true);
    const t1 = setTimeout(
      () => {
        canContinue = true;
      },
      m_data.drinking ? 4500 : 3000,
    );
    const t2 = setTimeout(() => {
      gameClient.sendPlayerInput("photoReady");
      failed = true;
      broadcastDeck(cards, round_progress, true);
    }, 1500);
    timeouts.push(t1, t2);
  };

  const progressRound = () => {
    showSuccess = true;
    const t1 = setTimeout(() => {
      showSuccess = false;
    }, 800);

    const new_round = round_progress + 1;
    broadcastDeck(cards, new_round, false);
    if (new_round == 4) {
      //won game
      gameClient.sendPlayerInput("confirm");
    }
    round_progress = -1;
    const t2 = setTimeout(() => {
      round_progress = new_round;
      broadcastDeck(cards, new_round, false);
    }, 1500);
    timeouts.push(t1, t2);
  };

  const startGame = () => {
    // Populate Deck
    cards = [];
    canContinue = false;
    round_progress = 0;
    failed = false;
    showSuccess = false;

    for (let i = 0; i < 4; i++) {
      const new_card = getRandomCard();
      cards = [...cards, new_card];
    }
    broadcastDeck(cards, 0, false);
  };

  const chooseColor = (event: Event) => {
    //flip card
    let current_cards = cards.slice();
    cards[0].flipped = true;
    cards = current_cards;
    broadcastDeck(cards, 0, false);

    const chosen_color = (event.currentTarget as HTMLButtonElement).value;
    if (chosen_color === cards[0].color) {
      progressRound();
    } else {
      failRound();
    }
  };
  const choosePosition = (event: Event) => {
    //flip card
    let current_cards = cards.slice();
    cards[1].flipped = true;
    cards = current_cards;
    broadcastDeck(cards, 1, false);

    const chosen_position = (event.currentTarget as HTMLButtonElement).value;
    if (chosen_position == "higher") {
      if (compareCardValues(cards[0], cards[1]) == -1) {
        progressRound();
      } else {
        failRound();
      }
    } else if (chosen_position == "lower") {
      if (compareCardValues(cards[0], cards[1]) == 1) {
        progressRound();
      } else {
        failRound();
      }
    } else {
      if (compareCardValues(cards[0], cards[1]) == 0) {
        progressRound();
      } else {
        failRound();
      }
    }
  };

  const chooseSpace = (event: Event) => {
    //flip card
    let current_cards = cards.slice();
    cards[2].flipped = true;
    cards = current_cards;
    broadcastDeck(cards, 2, false);

    const chosen_space = (event.currentTarget as HTMLButtonElement).value;
    if (chosen_space == "outside") {
      if (
        isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "outside" ||
        isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "equal"
      ) {
        progressRound();
      } else {
        failRound();
      }
    } else if (chosen_space == "between") {
      if (
        isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "inBetween" ||
        isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "equal"
      ) {
        progressRound();
      } else {
        failRound();
      }
    }
  };

  const chooseSuite = (event: Event) => {
    //flip card
    let current_cards = cards.slice();
    cards[3].flipped = true;
    cards = current_cards;
    broadcastDeck(cards, 3, false);

    const chosen_suite = (event.currentTarget as HTMLButtonElement).value;
    if (chosen_suite == "spade" && cards[3].type == "♠️") {
      progressRound();
    } else if (chosen_suite == "hearts" && cards[3].type == "♥️") {
      progressRound();
    } else if (chosen_suite == "diamonds" && cards[3].type == "♦️") {
      progressRound();
    } else if (chosen_suite == "clubs" && cards[3].type == "♣️") {
      progressRound();
    } else {
      failRound();
    }
  };

  onMount(() => {
    startGame();
  });

  onDestroy(() => {
    timeouts.forEach(clearTimeout);
  });
</script>

<div class="game-container">
  {#if failed}
    <div class="failure-screen" in:fade={{ duration: 300 }}>
      {#if m_data.drinking}
        <Drink prompt={"Drink."} />
        <button
          class="retro-action-btn restart-button"
          disabled={!canContinue}
          on:click={startGame}
          in:scale={{ duration: 400, delay: 200, easing: bounceOut }}
        >
          <span class="button-emoji">🔄</span>
          <span>I HAVE DRANK • NEW DECK</span>
        </button>
      {:else}
        <div
          class="fail-content"
          in:scale={{ duration: 500, easing: elasticOut }}
        >
          <div class="fail-badge">CRASH!</div>
          <h1 class="fail-title">SPUN OUT!</h1>
          <span class="fail-emoji">💥🚌💥</span>
          <p class="fail-subtitle">RESETTING TO CARD 1</p>
        </div>
        <button
          class="retro-action-btn restart-button"
          disabled={!canContinue}
          on:click={startGame}
          in:scale={{ duration: 400, delay: 300, easing: bounceOut }}
        >
          <span class="button-emoji">🔄</span>
          <span>GET NEW DECK</span>
        </button>
      {/if}
    </div>
  {:else}
    <div class="game-content">
      <!-- 90s Vintage Arcade Marquee Header -->
      <div class="arcade-header" in:fade={{ duration: 300 }}>
        <div class="arcade-marquee">
          <span class="retro-dot">●</span>
          <span class="header-title">BUS RIDE</span>
          <span class="retro-dot">●</span>
        </div>
        <div class="stage-pill">
          {#if round_progress === 0}
            STAGE 1 OF 4 • RED OR BLACK?
          {:else if round_progress === 1}
            STAGE 2 OF 4 • HIGHER OR LOWER?
          {:else if round_progress === 2}
            STAGE 3 OF 4 • OUTSIDE OR BETWEEN?
          {:else if round_progress === 3}
            STAGE 4 OF 4 • GUESS THE SUIT!
          {:else if round_progress === 4}
            STAGE CLEAR • BUS MASTER!
          {:else}
            STAGE ADVANCE...
          {/if}
        </div>
      </div>

      <!-- 4 Cards Rack Section -->
      <div class="cards-section">
        <div class="cards-container">
          {#each cards as card, index}
            <div
              class="card-wrapper"
              class:active-card={index === round_progress}
              in:fly={{
                y: -30,
                duration: 400,
                delay: index * 80,
              }}
            >
              {#if card == cards[round_progress]}
                <div
                  class="pointer-indicator"
                  in:scale={{
                    duration: 300,
                    easing: bounceOut,
                  }}
                >
                  ▼
                </div>
              {:else}
                <div class="pointer-placeholder"></div>
              {/if}
              <Card
                color={card.color}
                value={card.value}
                type={card.type}
                flipped={card.flipped}
                drinking={m_data.drinking}
              />
              <div class="step-num">#{index + 1}</div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Controls Section -->
      <div class="controls-section">
        {#if round_progress === -1}
          <div class="loading-indicator">
            <div class="retro-spinner"></div>
            <span class="loading-text">DEALING...</span>
          </div>
        {:else if round_progress === 0}
          <div class="button-group" in:fly={{ y: 30, duration: 350 }}>
            <button
              type="button"
              value="red"
              class="retro-btn red-btn"
              on:click={chooseColor}
            >
              <span class="btn-icon">♦</span>
              <span>RED</span>
            </button>
            <button
              value="black"
              type="button"
              class="retro-btn black-btn"
              on:click={chooseColor}
            >
              <span class="btn-icon">♠</span>
              <span>BLACK</span>
            </button>
          </div>
        {:else if round_progress === 1}
          <div class="button-group vertical" in:fly={{ y: 30, duration: 350 }}>
            <button
              value="higher"
              type="button"
              class="retro-btn cyan-btn"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="icon-park-solid:up-two" />
              <span>HIGHER</span>
            </button>
            <button
              value="same"
              type="button"
              class="retro-btn yellow-btn"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="material-symbols:equal-rounded" />
              <span>SAME VALUE</span>
            </button>
            <button
              value="lower"
              type="button"
              class="retro-btn purple-btn"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="icon-park-solid:down-two" />
              <span>LOWER</span>
            </button>
          </div>
        {:else if round_progress === 2}
          <div class="button-group" in:fly={{ y: 30, duration: 350 }}>
            <button
              value="outside"
              class="retro-btn orange-btn"
              on:click={chooseSpace}
            >
              <span class="btn-icon">◀ ▶</span>
              <span>OUTSIDE</span>
            </button>
            <button
              value="between"
              class="retro-btn cyan-btn"
              on:click={chooseSpace}
            >
              <span class="btn-icon">▶ ◀</span>
              <span>IN BETWEEN</span>
            </button>
          </div>
        {:else if round_progress === 3}
          <div class="button-grid" in:fly={{ y: 30, duration: 350 }}>
            <button
              value="spade"
              class="retro-btn suit-btn dark-suit"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♠</span>
              <span>SPADES</span>
            </button>
            <button
              value="hearts"
              class="retro-btn suit-btn red-suit"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♥</span>
              <span>HEARTS</span>
            </button>
            <button
              value="diamonds"
              class="retro-btn suit-btn red-suit"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♦</span>
              <span>DIAMONDS</span>
            </button>
            <button
              value="clubs"
              class="retro-btn suit-btn dark-suit"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♣</span>
              <span>CLUBS</span>
            </button>
          </div>
        {:else if round_progress === 4}
          <div
            class="victory-message"
            in:scale={{ duration: 500, easing: elasticOut }}
          >
            <span class="victory-emoji">👑</span>
            <h2 class="victory-text">YOU RODE THE BUS!</h2>
            <div class="victory-sub">1ST PLACE CHAMPION! 🚌✨</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if showSuccess}
    <div
      class="success-overlay"
      in:scale={{ duration: 250 }}
      out:fade={{ duration: 180 }}
    >
      <div class="success-banner">CORRECT! ★</div>
    </div>
  {/if}
</div>

<style>
  .game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #0f1026;
    background-image: 
      radial-gradient(#2c1a4d 15%, transparent 16%),
      radial-gradient(#1e153b 15%, #0d0a1a 85%);
    background-size: 24px 24px, 100% 100%;
    color: #ffffff;
    font-family: "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .game-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px 14px;
    gap: 10px;
    box-sizing: border-box;
  }

  /* 90s Arcade Marquee Header */
  .arcade-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .arcade-marquee {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ffe600;
    color: #000000;
    padding: 6px 18px;
    border: 3px solid #000000;
    border-radius: 6px;
    box-shadow: 4px 4px 0px #000000;
  }

  .header-title {
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .retro-dot {
    font-size: 0.8rem;
    color: #ff007f;
    animation: blinkDot 1s infinite alternate;
  }

  @keyframes blinkDot {
    0% { opacity: 0.2; }
    100% { opacity: 1; }
  }

  .stage-pill {
    background: #18182e;
    color: #00f0ff;
    font-size: 0.85rem;
    font-weight: 800;
    letter-spacing: 1px;
    padding: 4px 12px;
    border: 2px solid #00f0ff;
    border-radius: 20px;
    box-shadow: 2px 2px 0px #000000;
    text-align: center;
  }

  /* Cards Rack */
  .cards-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }

  .cards-container {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    width: 100%;
    max-width: 420px;
  }

  .card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: transform 0.2s ease;
  }

  .card-wrapper.active-card {
    transform: scale(1.06);
  }

  .pointer-indicator {
    font-size: 1.1rem;
    color: #ffe600;
    text-shadow: 0 0 6px #ffe600, 1px 1px 0 #000;
    animation: bouncePointer 0.8s ease-in-out infinite;
    line-height: 1;
    height: 18px;
  }

  .pointer-placeholder {
    height: 18px;
  }

  @keyframes bouncePointer {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .step-num {
    font-size: 0.75rem;
    font-weight: 900;
    color: #94a3b8;
    background: #1e1b4b;
    border: 1.5px solid #000;
    padding: 1px 6px;
    border-radius: 4px;
    box-shadow: 1px 1px 0 #000;
  }

  .card-wrapper.active-card .step-num {
    background: #ffe600;
    color: #000;
    border-color: #000;
  }

  /* 90s Arcade Buttons */
  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 8px;
  }

  .button-group {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: center;
  }

  .button-group.vertical {
    flex-direction: column;
    max-width: 380px;
    margin: 0 auto;
  }

  .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
  }

  /* Tactile 90s Push-Buttons */
  .retro-btn {
    border: 3px solid #000000;
    border-radius: 10px;
    padding: 14px 16px;
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: 1px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 58px;
    box-shadow: 0 5px 0px #000000;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .retro-btn:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0px #000000;
  }

  .red-btn {
    background: #ef4444;
    color: #ffffff;
    flex: 1;
    border-color: #000;
  }

  .black-btn {
    background: #0f172a;
    color: #ffffff;
    flex: 1;
    border-color: #000;
  }

  .cyan-btn {
    background: #06b6d4;
    color: #000000;
    flex: 1;
  }

  .yellow-btn {
    background: #facc15;
    color: #000000;
    flex: 1;
  }

  .purple-btn {
    background: #a855f7;
    color: #ffffff;
    flex: 1;
  }

  .orange-btn {
    background: #f97316;
    color: #000000;
    flex: 1;
  }

  .suit-btn {
    font-size: 1.05rem;
    padding: 12px 10px;
  }

  .suit-btn.dark-suit {
    background: #1e293b;
    color: #ffffff;
  }

  .suit-btn.red-suit {
    background: #dc2626;
    color: #ffffff;
  }

  .btn-icon, .suit-icon {
    font-size: 1.4rem;
    line-height: 1;
  }

  /* 90s Failure Screen */
  .failure-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    gap: 20px;
    text-align: center;
  }

  .fail-badge {
    display: inline-block;
    background: #ff0055;
    color: #fff;
    padding: 4px 14px;
    border: 3px solid #000;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 900;
    box-shadow: 3px 3px 0 #000;
    margin-bottom: 8px;
    animation: flashBadge 0.6s infinite alternate;
  }

  @keyframes flashBadge {
    0% { transform: scale(0.95); background: #ff0055; }
    100% { transform: scale(1.05); background: #ffe600; color: #000; }
  }

  .fail-title {
    font-size: 2.8rem;
    font-weight: 900;
    color: #ff0055;
    margin: 0;
    letter-spacing: 2px;
    text-shadow: 3px 3px 0px #000000;
  }

  .fail-emoji {
    font-size: 4.5rem;
    display: block;
    margin: 10px 0;
  }

  .fail-subtitle {
    font-size: 1.1rem;
    color: #cbd5e1;
    font-weight: 800;
    letter-spacing: 1px;
    margin: 0;
  }

  .retro-action-btn {
    border: 3px solid #000;
    border-radius: 12px;
    padding: 16px 28px;
    font-family: inherit;
    font-size: 1.15rem;
    font-weight: 900;
    background: #ffe600;
    color: #000;
    box-shadow: 0 6px 0 #000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }

  .retro-action-btn:not(:disabled):active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #000;
  }

  .retro-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #64748b;
    color: #1e293b;
  }

  /* Success Flash Overlay */
  .success-overlay {
    position: fixed;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 999;
    pointer-events: none;
  }

  .success-banner {
    background: #10b981;
    color: #ffffff;
    padding: 8px 24px;
    font-size: 1.8rem;
    font-weight: 900;
    border: 3px solid #000;
    border-radius: 8px;
    box-shadow: 4px 4px 0 #000;
    letter-spacing: 2px;
    text-shadow: 2px 2px 0 #000;
  }

  /* Victory Message */
  .victory-message {
    text-align: center;
    padding: 18px;
    background: #10b981;
    border: 3px solid #000000;
    border-radius: 12px;
    box-shadow: 4px 4px 0px #000000;
  }

  .victory-emoji {
    font-size: 3rem;
  }

  .victory-text {
    font-size: 1.6rem;
    font-weight: 900;
    color: #ffffff;
    margin: 4px 0;
    letter-spacing: 1px;
    text-shadow: 2px 2px 0 #000;
  }

  .victory-sub {
    font-size: 1rem;
    font-weight: 800;
    color: #ffe600;
    letter-spacing: 1px;
  }

  /* Loading State */
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
  }

  .retro-spinner {
    width: 36px;
    height: 36px;
    border: 4px solid #334155;
    border-top-color: #00f0ff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #00f0ff;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 380px) {
    .header-title {
      font-size: 1.15rem;
    }

    .retro-btn {
      font-size: 0.95rem;
      min-height: 52px;
      padding: 10px 12px;
    }

    .cards-container {
      gap: 5px;
    }
  }
</style>
