<script lang="ts">
  import { onMount } from "svelte";
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

  const failRound = () => {
    setTimeout(
      () => {
        canContinue = true;
      },
      m_data.drinking ? 4500 : 3000,
    );
    setTimeout(() => {
      gameClient.sendPlayerInput("photoReady");
      failed = true;
    }, 1500);
  };

  const progressRound = () => {
    showSuccess = true;
    setTimeout(() => {
      showSuccess = false;
    }, 800);

    const new_round = round_progress + 1;
    if (new_round == 4) {
      //won game
      gameClient.sendPlayerInput("confirm");
    }
    round_progress = -1;
    setTimeout(() => {
      round_progress = new_round;
    }, 1500);
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
    console.log(cards);
  };

  const chooseColor = (event: Event) => {
    //flip card
    let current_cards = cards.slice();
    cards[0].flipped = true;
    cards = current_cards;

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
</script>

<div class="game-container">
  {#if failed}
    <div class="failure-screen" in:fade={{ duration: 300 }}>
      {#if m_data.drinking}
        <Drink prompt={"Drink."} />
        <button
          class="action-button restart-button"
          disabled={!canContinue}
          on:click={startGame}
          in:scale={{ duration: 400, delay: 200, easing: bounceOut }}
        >
          <span class="button-emoji">🔄</span>
          I have drank. Give me a new deck.
        </button>
      {:else}
        <div
          class="fail-content"
          in:scale={{ duration: 500, easing: elasticOut }}
        >
          <h1 class="fail-title">You Failed!</h1>
          <span class="fail-emoji">😞</span>
          <p class="fail-subtitle">Try Again</p>
        </div>
        <button
          class="action-button restart-button"
          disabled={!canContinue}
          on:click={startGame}
          in:scale={{ duration: 400, delay: 300, easing: bounceOut }}
        >
          <span class="button-emoji">🔄</span>
          Give me a new deck
        </button>
      {/if}
    </div>
  {:else}
    <div class="game-content">
      <h1 class="game-title" in:fade={{ duration: 300 }}>
        <span class="title-emoji">🚌</span>
        Ride the Bus
      </h1>

      <div class="cards-section">
        <div class="cards-container">
          {#each cards as card, index}
            <div
              class="card-wrapper"
              in:fly={{
                y: -50,
                duration: 500,
                delay: index * 100,
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
                  👇
                </div>
              {/if}
              <Card
                color={card.color}
                value={card.value}
                type={card.type}
                flipped={card.flipped}
                drinking={m_data.drinking}
              />
            </div>
          {/each}
        </div>
      </div>

      <div class="controls-section">
        {#if round_progress >= 0 && round_progress < 4}
          <div class="question-text" in:fade={{ duration: 300 }}>
            Will this card be:
          </div>
        {/if}

        {#if round_progress === -1}
          <div class="loading-indicator">
            <div class="spinner"></div>
          </div>
        {:else if round_progress === 0}
          <div class="button-group" in:fly={{ y: 50, duration: 400 }}>
            <button
              type="button"
              value="red"
              class="choice-button red-button"
              on:click={chooseColor}
            >
              <span class="button-icon">🔴</span>
              Red
            </button>
            <button
              value="black"
              type="button"
              class="choice-button black-button"
              on:click={chooseColor}
            >
              <span class="button-icon">⚫</span>
              Black
            </button>
          </div>
        {:else if round_progress === 1}
          <div class="button-group vertical" in:fly={{ y: 50, duration: 400 }}>
            <button
              value="higher"
              type="button"
              class="choice-button primary-button"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="icon-park-solid:up-two" />
              Higher
            </button>
            <button
              value="same"
              type="button"
              class="choice-button primary-button"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="material-symbols:equal-rounded" />
              Same
            </button>
            <button
              value="lower"
              type="button"
              class="choice-button primary-button"
              on:click={choosePosition}
            >
              <Icon font-size="2rem" icon="icon-park-solid:down-two" />
              Lower
            </button>
          </div>
        {:else if round_progress === 2}
          <div class="button-group" in:fly={{ y: 50, duration: 400 }}>
            <button
              value="outside"
              class="choice-button secondary-button"
              on:click={chooseSpace}
            >
              <span class="button-icon">↔️</span>
              Outside
            </button>
            <button
              value="between"
              class="choice-button secondary-button"
              on:click={chooseSpace}
            >
              <span class="button-icon">🎯</span>
              In Between
            </button>
          </div>
        {:else if round_progress === 3}
          <div class="button-grid" in:fly={{ y: 50, duration: 400 }}>
            <button
              value="spade"
              class="choice-button suit-button"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♠️</span>
              Spade
            </button>
            <button
              value="hearts"
              class="choice-button suit-button"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♥️</span>
              Hearts
            </button>
            <button
              value="diamonds"
              class="choice-button suit-button"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♦️</span>
              Diamonds
            </button>
            <button
              value="clubs"
              class="choice-button suit-button"
              on:click={chooseSuite}
            >
              <span class="suit-icon">♣️</span>
              Clubs
            </button>
          </div>
        {:else if round_progress === 4}
          <div
            class="victory-message"
            in:scale={{ duration: 600, easing: elasticOut }}
          >
            <span class="victory-emoji">🎉</span>
            <h2 class="victory-text">You rode the bus!</h2>
            <span class="victory-bus">🚌✨</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if showSuccess}
    <div
      class="success-overlay"
      in:scale={{ duration: 300 }}
      out:fade={{ duration: 200 }}
    >
      <span class="success-emoji">✅</span>
    </div>
  {/if}
</div>

<style>
  .game-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height for mobile */
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .game-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    gap: 16px;
  }

  .game-title {
    text-align: center;
    font-size: 2rem;
    font-weight: bold;
    color: #f1f5f9;
    margin: 0;
    padding: 12px 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    animation: titlePulse 2s ease-in-out infinite;
  }

  @keyframes titlePulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  .title-emoji {
    display: inline-block;
    font-size: 2.5rem;
    margin-right: 8px;
    animation: busMove 3s ease-in-out infinite;
  }

  @keyframes busMove {
    0%,
    100% {
      transform: translateX(0) rotate(0deg);
    }
    25% {
      transform: translateX(5px) rotate(2deg);
    }
    75% {
      transform: translateX(-5px) rotate(-2deg);
    }
  }

  .cards-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
  }

  .cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
  }

  .card-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .pointer-indicator {
    font-size: 2rem;
    animation: bounce 1s ease-in-out infinite;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .controls-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 16px;
  }

  .question-text {
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  .button-group {
    display: flex;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }

  .button-group.vertical {
    flex-direction: column;
    max-width: 400px;
    margin: 0 auto;
  }

  .button-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .choice-button {
    padding: 18px 24px;
    font-size: 1.125rem;
    font-weight: bold;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 64px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  .choice-button:active {
    transform: scale(0.95);
  }

  .choice-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }

  .red-button {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: white;
    flex: 1;
  }

  .black-button {
    background: linear-gradient(135deg, #1f2937 0%, #000000 100%);
    color: white;
    flex: 1;
  }

  .primary-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
  }

  .secondary-button {
    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
    color: white;
    flex: 1;
  }

  .suit-button {
    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
    color: white;
  }

  .button-icon,
  .button-emoji,
  .suit-icon {
    font-size: 1.5rem;
  }

  .loading-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .victory-message {
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, #10b981 0%, #047857 100%);
    border-radius: 16px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }

  .victory-emoji {
    font-size: 4rem;
    display: block;
    animation: rotate 2s ease-in-out infinite;
  }

  @keyframes rotate {
    0%,
    100% {
      transform: rotate(0deg) scale(1);
    }
    25% {
      transform: rotate(-10deg) scale(1.1);
    }
    75% {
      transform: rotate(10deg) scale(1.1);
    }
  }

  .victory-text {
    font-size: 1.75rem;
    font-weight: bold;
    color: white;
    margin: 12px 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .victory-bus {
    font-size: 3rem;
    display: block;
    margin-top: 8px;
    animation: busMove 3s ease-in-out infinite;
  }

  .failure-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
    gap: 24px;
  }

  .fail-content {
    text-align: center;
  }

  .fail-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ef4444;
    margin: 0 0 16px 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .fail-emoji {
    font-size: 6rem;
    display: block;
    margin: 16px 0;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px) rotate(-5deg);
    }
    75% {
      transform: translateX(10px) rotate(5deg);
    }
  }

  .fail-subtitle {
    font-size: 1.5rem;
    color: #f1f5f9;
    font-weight: 600;
  }

  .action-button {
    padding: 20px 32px;
    font-size: 1.125rem;
    font-weight: bold;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    color: white;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;
    min-height: 64px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  }

  .action-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }

  .action-button:not(:disabled):active {
    transform: scale(0.95);
  }

  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .success-overlay {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    pointer-events: none;
  }

  .success-emoji {
    font-size: 3rem;
    display: block;
    filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8));
  }

  @media (max-width: 380px) {
    .game-title {
      font-size: 1.5rem;
    }

    .title-emoji {
      font-size: 2rem;
    }

    .choice-button {
      padding: 14px 18px;
      font-size: 1rem;
      min-height: 56px;
    }

    .button-icon,
    .button-emoji,
    .suit-icon {
      font-size: 1.25rem;
    }

    .cards-container {
      gap: 12px;
    }

    .victory-text {
      font-size: 1.5rem;
    }

    .fail-title {
      font-size: 2rem;
    }

    .fail-emoji {
      font-size: 4rem;
    }
  }

  @media (max-height: 700px) {
    .cards-section {
      min-height: 180px;
    }

    .game-title {
      padding: 8px 0;
    }

    .choice-button {
      min-height: 56px;
      padding: 14px 20px;
    }
  }
</style>
