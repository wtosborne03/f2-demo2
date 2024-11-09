<script lang="ts">
  import { player_state } from "../stores/player_state";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { sendMessage } from "$lib";
  import type { RouletteData } from "../types/page_data";
  import { RangeSlider } from "@skeletonlabs/skeleton";

  let selected_challenge = "";

  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const challenges: Record<string, string> = {
    "Take 3 drinks": "Take 3 drinks",
    "Take 5 drinks": "Take 5 drinks",
    "Take 10 drinks": "Take 10 drinks",
    "Take 15 drinks": "Take 15 drinks",
    "Take 20 drinks": "Take 20 drinks",
    "Down your drink": "Down your drink",
    "Give the player on the right your wallet": "Give Wallet",
    "Give the player on the left a nice compliment": "Compliment",
  };

  const toastStore = getToastStore();

  const available_challenges = shuffle(Object.keys(challenges)).slice(0, 5);

  const m_data = get<PlayerState>(player_state).page_data as RouletteData;

  function placeBet() {
    if (selected_challenge === "") {
      toastStore.trigger({
        message: "Please select a challenge",
        background: "variant-filled-error",
      });
      return;
    }
    sendMessage({
      type: "game",
      data: {
        type: "bet",
        data: {
          challenge: selected_challenge,
          short_challenge: challenges[selected_challenge],
        },
      },
    });
  }
</script>

<div class="flex flex-col items-center mt-10">
  <h1 class="text-4xl font-bold mb-8">Add a punishment to the Wheel</h1>
  {#each available_challenges as challenge}
    <button
      class={"btn variant-filled w-full mb-4 text-xl font-medium" +
        (selected_challenge === challenge
          ? " variant-filled-primary outline-4 outline-white"
          : "")}
      on:click={() => (selected_challenge = challenge)}
    >
      {challenge}
    </button>
  {/each}
  <button class="btn variant-filled-secondary mt-8" on:click={placeBet}
    >Choose Challenge 🔥</button
  >
</div>
