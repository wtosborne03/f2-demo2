<script lang="ts">
  import { player_state } from "../stores/player_state";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { sendMessage } from "$lib/webSocketService";
  import { getName } from "$lib/gameService";
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
    "Give the player on the left a nice compliment": "Compliment 👈",
    "Take a shot": "Take a shot",
    "Take off an article of clothing": "Clothes off",
    "Shotgun a beer": "Shotgun Beer",
    "Name a law that you have broken": "Name Crime",
    "Text a family member that you died": "Text Family",
    "Take 7 drinks if your'e unemployed": "Unemployed Drink",
    "Take 8 drinks if you're a Man": "Men Drink",
    "Take 8 drinks if you're a Woman": "Women Drink",
    "Name your favorite slur": "Favorite Slur",
    "Take a shot if you're an Atheist": "Atheists Drink",
    "Show the last photo in your camera roll": "Camera Roll",
    "Let the person on your right text anyone on your phone": "Text 'em",
    "Reveal the first three digits of your Social Security Number":
      "SSN sneak peek",
    [`Take a drink from ${getName()}'s cup`]: `${getName()}'s cup`,
    "Take a drink if you've lost money gambling": "Gamble Regret",
    [`Give ${getName()} a compliment'`]: `Compliment Me`,
    "Reveal your phone's daily screentime": "Screen Reveal",
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
      class={"btn variant-filled w-full mb-4 text-xl font-medium text-wrap" +
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
