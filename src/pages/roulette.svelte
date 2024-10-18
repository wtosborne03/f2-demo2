<script lang="ts">
  import { player_state } from "../stores/player_state";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { sendMessage } from "$lib";
  import type { RouletteData } from "../types/page_data";
  import { RangeSlider } from "@skeletonlabs/skeleton";

  let selectedPlayer = "";
  let selectedColor = "";
  let drinks = 10;
  let s_drinks = 1;

  let betAmount = 5;
  const m_data = get<PlayerState>(player_state).page_data as RouletteData;
  const players = m_data.players;
  const drinking = m_data.drinking;

  const toastStore = getToastStore();

  const colors = ["red", "black"];
  const numbers = [
    { option: "0", style: { backgroundColor: "green", textColor: "black" } },
    { option: "00", style: { backgroundColor: "green", textColor: "black" } },
    { option: "1", style: { backgroundColor: "red", textColor: "black" } },
    { option: "2", style: { backgroundColor: "black", textColor: "white" } },
    { option: "3", style: { backgroundColor: "red", textColor: "black" } },
    { option: "4", style: { backgroundColor: "black", textColor: "white" } },
    { option: "5", style: { backgroundColor: "red", textColor: "black" } },
    { option: "6", style: { backgroundColor: "black", textColor: "white" } },
    { option: "7", style: { backgroundColor: "red", textColor: "black" } },
    { option: "8", style: { backgroundColor: "black", textColor: "white" } },
    { option: "9", style: { backgroundColor: "red", textColor: "black" } },
    { option: "10", style: { backgroundColor: "black", textColor: "white" } },
  ];

  function placeBet() {
    sendMessage({
      type: "game",
      data: {
        type: "bet",
        data: {
          color: selectedColor,
          player: selectedPlayer,
        },
      },
    });
  }
</script>

<div class="flex flex-col items-center mt-10">
  <h1 class="text-2xl font-bold mb-4">
    {drinking ? `Give out ${drinks} drinks` : "Steal Doubloons from a player"}
  </h1>
  <div class="mb-10">
    <label for="betAmount" class="mr-2 text-center">Player:</label>
    {#each players as player}
      <button
        class="btn variant-filled-primary border-4 ml-2"
        on:click={() => (selectedPlayer = player)}>{player}</button
      >
    {/each}
  </div>

  <RangeSlider
    name="range-slider"
    bind:value={s_drinks}
    max={drinks}
    min={1}
    step={1}
    ticked
  >
    <div class="flex justify-between items-center text-xl">
      <div class="font-bold">Drinks:</div>
      <div class="">{s_drinks} / {drinks}</div>
    </div>
  </RangeSlider>

  <div class="mb-10 mt-10">
    <label for="selectedNumber" class="mr-2 text-center">Number:</label>
    <div class="flex flex-row flex-wrap gap-1 justify-center">
      {#each numbers as number}
        <button
          class="btn variant-filled-primary w-12 rounded-lg border-4"
          style:background-color={number.style.backgroundColor}
          style:text-color={number.style.textColor}
          style:opacity={selectedColor == number.option ? 1 : 0.5}
          style:border-color={selectedColor == number.option
            ? "white"
            : "transparent"}
          on:click={() => (selectedColor = number.option)}
          >{number.option}</button
        >
      {/each}
    </div>
  </div>

  <button
    on:click={placeBet}
    class="btn btn-lg variant-filled"
    disabled={selectedPlayer === "" || selectedColor === ""}
  >
    Place Bet <span class="text-xl ml-2"> 🎰</span>
  </button>
</div>
