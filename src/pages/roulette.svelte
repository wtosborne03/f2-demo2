<script lang="ts">
  import type { RouletteData } from "../types/page_data";
  import { toaster } from "$lib/util/toaster";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";
  import { fly } from "svelte/transition";

  let selected_challenge = "";

  const shuffle = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };
  const gs = get(gameState);

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
    [`Take a drink from ${gs.name}'s cup`]: `${gs.name}'s cup`,
    "Take a drink if you've lost money gambling": "Gamble Regret",
    [`Give ${gs.name} a compliment'`]: `Compliment Me`,
    "Reveal your phone's daily screentime": "Screen Reveal",
  };

  const available_challenges = shuffle(Object.keys(challenges)).slice(0, 5);

  const m_data = gs.page_data;

  function placeBet() {
    if (selected_challenge === "") {
      toaster.error({
        title: "Challenge Not Selected",
        description: "Please select a challenge!",
      });
      return;
    }
    gameClient.sendPlayerInput("roulette", {
      challenge: selected_challenge,
      short_challenge: challenges[selected_challenge],
    });
  }

  function getChallengeEmoji(challenge: string): string {
    const text = challenge.toLowerCase();
    if (text.includes("shotgun")) return "⚡";
    if (text.includes("shot")) return "🥃";
    if (text.includes("drink") || text.includes("cup") || text.includes("down your")) return "🍺";
    if (text.includes("compliment")) return "💬";
    if (text.includes("wallet")) return "💳";
    if (text.includes("clothing") || text.includes("clothes") || text.includes("off")) return "👕";
    if (text.includes("law") || text.includes("crime")) return "⚖️";
    if (text.includes("text") || text.includes("phone") || text.includes("family")) return "📱";
    if (text.includes("unemployed")) return "💼";
    if (text.includes("man") || text.includes("woman") || text.includes("slur")) return "👥";
    if (text.includes("photo") || text.includes("camera") || text.includes("roll")) return "📸";
    if (text.includes("social security") || text.includes("ssn")) return "🔒";
    if (text.includes("screentime") || text.includes("screen")) return "⏱️";
    if (text.includes("gambling") || text.includes("money")) return "🎲";
    return "🔥";
  }
</script>

<div class="w-full max-w-md mx-auto p-5 md:p-6 bg-[var(--m3c-surface-container)] text-[var(--m3c-on-surface)] rounded-[28px] border border-[var(--m3c-outline-variant)] shadow-2xl flex flex-col gap-5">
  <div class="text-center space-y-1">
    <h1 class="text-2xl font-bold tracking-tight text-[var(--m3c-on-surface)]">
      Add a punishment to the Wheel
    </h1>
    <p class="text-sm text-[var(--m3c-on-surface-variant)]">
      Select a challenge to put on the host's wheel.
    </p>
  </div>

  <div class="flex flex-col gap-3">
    {#each available_challenges as challenge, i (challenge)}
      <div in:fly={{ y: 15, delay: i * 50, duration: 250 }}>
        <button
          type="button"
          class="flex items-center w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer {selected_challenge === challenge ? 'bg-[var(--m3c-primary-container)] border-[var(--m3c-primary)] text-[var(--m3c-on-primary-container)]' : 'bg-[var(--m3c-surface-container-low)] border-[var(--m3c-outline-variant)] text-[var(--m3c-on-surface)] hover:bg-[var(--m3c-surface-container-high)]'}"
          on:click={() => (selected_challenge = challenge)}
        >
          <!-- EMOJI BADGE -->
          <span class="flex items-center justify-center w-10 h-10 rounded-full mr-3 text-lg bg-[var(--m3c-surface-container-highest)] select-none">
            {getChallengeEmoji(challenge)}
          </span>

          <!-- CHALLENGE TEXT -->
          <span class="flex-1 font-semibold text-base leading-snug pr-2 text-wrap">
            {challenge}
          </span>

          <!-- RADIO CHECKMARK -->
          <span class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 {selected_challenge === challenge ? 'border-[var(--m3c-primary)] bg-[var(--m3c-primary)]' : 'border-[var(--m3c-outline)]'}">
            {#if selected_challenge === challenge}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-[var(--m3c-on-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            {/if}
          </span>
        </button>
      </div>
    {/each}
  </div>

  <button
    type="button"
    class="w-full py-4 font-bold text-lg rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer {selected_challenge !== '' ? 'bg-[var(--m3c-primary)] text-[var(--m3c-on-primary)] shadow-md hover:bg-[var(--m3c-primary-container)] hover:text-[var(--m3c-on-primary-container)]' : 'bg-[var(--m3c-surface-variant)] text-[var(--m3c-on-surface-variant)] opacity-50 cursor-not-allowed pointer-events-none'}"
    on:click={placeBet}
    disabled={selected_challenge === ""}
  >
    Choose Challenge 🔥
  </button>
</div>

