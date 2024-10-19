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
  const player_colors = m_data.player_colors;
  let selectedPlayers: string[] = [];
  const drinking = m_data.drinking;

  const toastStore = getToastStore();

  const colors = ["red", "black"];
  const numbers = m_data.options;

  function placeBet() {
    drinks = drinks - s_drinks;
    sendMessage({
      type: "game",
      data: {
        type: "bet",
        data: {
          drinks: s_drinks,
          color: selectedColor,
          player: selectedPlayer,
        },
        done: drinks == 0 || selectedPlayers.length == players.length - 1,
      },
    });
    selectedPlayers = [...selectedPlayers, selectedPlayer];
    s_drinks = 1;
    selectedPlayer = "";
    selectedColor = "";
  }
</script>

<div class="flex flex-col items-center mt-10">
  <h1 class="text-2xl font-bold mb-4">
    {drinking
      ? `Give out ${drinks} drinks`
      : `Steal ${drinks * 100} Doubloons from a player`}
  </h1>
  <div class="mb-10">
    <label for="betAmount" class="mr-2 text-center">Player:</label>
    {#each players as player, index}
      {#if !selectedPlayers.includes(player)}
        <button
          class="btn variant-filled-primary border-4 ml-2"
          style:opacity={selectedPlayer == player ? 1 : 0.5}
          style:border-color={selectedPlayer == player
            ? "white"
            : "transparent"}
          style:text-color={selectedPlayer == player ? "white" : "black"}
          style:text-shadow={"1px 1px 5px black"}
          style:background-color={player_colors[index]}
          on:click={() => (selectedPlayer = player)}>{player}</button
        >
      {/if}
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
      <div class="font-bold mr-2">{drinking ? "Drinks" : "Doubloons"}</div>
      <div class="">
        {drinking ? s_drinks : s_drinks * 100} / {drinking
          ? drinks
          : drinks * 100}
      </div>
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
