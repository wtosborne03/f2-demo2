<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale, fade } from "svelte/transition";

  let m_data: any = {};
  let guessValue = 50;
  let submitted = false;
  let imgFailed = false;

  // Retrieve the page_data
  m_data = get(gameState).page_data || {};

  function submitGuess() {
    if (submitted) return;
    submitted = true;
    gameClient.sendInput({
      type: "kalshi_guess",
      guess: guessValue,
    });
  }
</script>

<div
  class="kalshi-page w-full max-w-md mx-auto flex flex-col justify-center p-6 text-[#080c14] font-sans"
>
  {#if !submitted}
    <div class="w-full flex flex-col gap-5" in:scale={{ duration: 300 }}>
      <!-- Category Badge & Header -->
      <div class="text-center space-y-2">
        <span
          class="inline-block px-4 py-1.5 k-badge text-xs font-bold tracking-wider uppercase rounded-sm"
        >
          {m_data.category || "Prediction Market"}
        </span>
        {#if m_data.subtitle}
          <h1 class="text-xl font-black leading-tight text-[#080c14] px-2 mt-2">
            {m_data.question || "Will the event happen?"}
          </h1>
        {:else}
          <h1 class="text-md font-black leading-tight text-[#080c14] px-2 mt-2">
            {m_data.question || "Will the event happen?"}
          </h1>
        {/if}
        {#if m_data.subTitle}
          <p class="text-xl text-[#080c14]/90 font-semibold tracking-wide">
            {m_data.subTitle}
          </p>
        {/if}
      </div>

      <!-- Guess Display & Slider -->
      <div class="space-y-6 bg-[#080c14]/10 p-4 rounded-2xl">
        <div class="text-center">
          <div
            class="text-6xl font-black tracking-tight k-accent-text mt-2 flex items-center justify-center"
          >
            <span>{guessValue}</span>
            <span class="text-3xl opacity-60 font-medium ml-1">%</span>
          </div>
        </div>

        <!-- Slider Track -->
        <div class="space-y-4">
          <div class="py-4 relative flex items-center w-full">
            <input
              type="range"
              min="1"
              max="99"
              bind:value={guessValue}
              class="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer focus:outline-none"
            />
          </div>

          <!-- Ticks description -->
          <div
            class="flex justify-between text-[10px] font-bold text-[#080c14]/60 px-2"
          >
            <span>NO (1%)</span>
            <span>UNSURE (50%)</span>
            <span>YES (99%)</span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="px-2">
        <button
          on:click={submitGuess}
          class="w-full py-4 k-accent-bg active:scale-98 transition-all font-black tracking-wider uppercase rounded-lg text-center text-sm cursor-pointer"
        >
          Lock In Guess
        </button>
      </div>
    </div>
  {:else}
    <div
      class="w-full flex flex-col items-center justify-center text-center gap-6 py-12"
      in:scale={{ duration: 400, start: 0.9 }}
    >
      <div
        class="w-20 h-20 bg-[#080c14]/10 k-accent-text rounded-full flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-[#080c14]">Estimate Locked!</h2>
        <p class="text-[#080c14]/70 text-sm font-semibold">
          Your guess of <strong class="k-accent-text text-lg font-black"
            >{guessValue}%</strong
          > is registered.
        </p>
        <p class="text-[#080c14]/50 text-xs mt-2 font-bold">
          Waiting for other players to submit...
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body:has(.kalshi-page)) {
    background-color: #00dd94 !important;
  }
  :global(#main-background:has(.kalshi-page)) {
    background-color: #00dd94 !important;
    padding: 0 !important;
  }

  .k-badge {
    background: rgba(8, 12, 20, 0.08);
    color: #080c14;
  }
  .k-accent-text {
    color: #080c14;
  }
  .k-accent-bg {
    background: #080c14;
    color: #00dd94;
  }

  /* Customizing range inputs inside webkit/moz browsers */
  input[type="range"]::-webkit-slider-runnable-track {
    background: rgba(8, 12, 20, 0.15);
    height: 12px;
    border-radius: 9999px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #080c14;
    cursor: pointer;
    margin-top: -6px;
    transition: transform 0.1s;
  }
  input[type="range"]::-webkit-slider-thumb:active {
    transform: scale(1.2);
  }
  input[type="range"]::-moz-range-track {
    background: rgba(8, 12, 20, 0.15);
    height: 12px;
    border-radius: 9999px;
  }
  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #080c14;
    cursor: pointer;
  }
</style>
