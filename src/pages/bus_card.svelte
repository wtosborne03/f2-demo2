<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../components/card.svelte";
  import { sendMessage } from "$lib"; // Assuming you have some WebSocket or API communication
  import type { BusData } from "../types/page_data";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";

  let m_data: BusData;
  m_data = get<PlayerState>(player_state).page_data;

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

    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomValue = values[Math.floor(Math.random() * values.length)];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      color: randomColor,
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

  const failRound = () => {
    setTimeout(
      () => {
        canContinue = true;
      },
      m_data.drinking ? 4500 : 3000,
    );
    setTimeout(() => {
      failed = true;
    }, 1500);
  };

  const progressRound = () => {
    const new_round = round_progress + 1;
    if (new_round == 4) {
      // Won the Game
      sendMessage({
        type: "game",
        data: {
          type: "win",
        },
      });
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
      if (isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "outside") {
        progressRound();
      } else {
        failRound();
      }
    } else if (chosen_space == "between") {
      if (
        isCardOutsideOrInBetween(cards[2], cards[0], cards[1]) == "inBetween"
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

<div
  class="container h-full mx-auto w-full flex flex-col justify-start items-center"
>
  {#if failed}
    {#if m_data.drinking}
      <h1 class="mb-4 text-center text-4xl">You Failed. Drink.</h1>
      <span class="text-8xl mb-4">🍺</span>
      <button
        class="btn variant-filled"
        disabled={!canContinue}
        on:click={startGame}>I have drank. Give me a new deck.</button
      >
    {:else}
      <h1 class="mb-4 text-center text-4xl">You Failed. Try Again</h1>
      <span class="text-8xl mb-4">🃏</span>
      <button
        class="btn variant-filled"
        disabled={!canContinue}
        on:click={startGame}>Give me a new deck.</button
      >
    {/if}
  {:else}
    <h1 class="mb-4 text-center text-4xl">Ride the Bus</h1>
    <div class="flex flex-wrap flex-row justify-center gap-4 mb-4">
      {#each cards as card}
        <div class="flex flex-col justify-end items-center h-36 gap-2">
          {#if card == cards[round_progress]}
            <span>👇</span>
          {/if}
          <Card
            color={card.color}
            value={card.value}
            type={card.type}
            flipped={card.flipped}
          />
        </div>
      {/each}
    </div>
    {#if round_progress >= 0 && round_progress < 4}
      <div class="text-xl mb-4">Will this card be:</div>
    {/if}
    {#if round_progress === -1}
      <div></div>
    {:else if round_progress === 0}
      <div class="btn-group font-bold underline">
        <button value="red" class="bg-red-600" on:click={chooseColor}
          >Red</button
        >
        <button value="black" class="bg-black" on:click={chooseColor}
          >Black</button
        >
      </div>
    {:else if round_progress === 1}
      <div class="btn-group variant-filled-primary font-bold underline">
        <button value="lower" on:click={choosePosition}>Lower</button>
        <button value="same" on:click={choosePosition}>Same</button>
        <button value="higher" on:click={choosePosition}>Higher</button>
      </div>
    {:else if round_progress === 2}
      <div class="btn-group variant-filled font-bold underline">
        <button value="outside" on:click={chooseSpace}>Outside </button>
        <button value="between" on:click={chooseSpace}>In Between</button>
      </div>
    {:else if round_progress === 3}
      <div
        class="btn-group-vertical variant-filled-primary font-bold underline"
      >
        <button value="spade" on:click={chooseSuite}>Spade ♠️</button>
        <button value="hearts" on:click={chooseSuite}>Hearts ♥️</button>
        <button value="diamonds" on:click={chooseSuite}>Diamonds ♦️</button>
        <button value="clubs" on:click={chooseSuite}>Clubs ♣️</button>
      </div>
    {:else if round_progress === 4}
      <div class="btn-group font-bold underline">You rode the bus! 🚌</div>
    {/if}
  {/if}
</div>
