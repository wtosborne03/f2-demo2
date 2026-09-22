<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";

  let m_data: any = {};
  let guessValue = 50;
  let submitted = false;

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
  class="kalshi-page w-full max-w-md mx-auto flex flex-col justify-center p-5 font-sans"
>
  {#if !submitted}
    <div class="w-full flex flex-col gap-5" in:scale={{ duration: 300 }}>
      <!-- Category Badge & Header -->
      <div class="text-center space-y-2">
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-[2px] border-[#11141A] shadow-[2px_2px_0px_#11141A] text-xs font-black tracking-widest uppercase rounded-full text-[#11141A]"
        >
          <span
            class="w-2 h-2 rounded-full bg-[#2563EB] inline-block border border-[#11141A]"
          ></span>
          {m_data.category || "Prediction Market"}
        </span>
        <h1
          class="text-2xl font-black leading-tight text-[#11141A] px-2 mt-2 tracking-tight"
        >
          {m_data.question || "Will the event happen?"}
        </h1>
        {#if m_data.subTitle}
          <p
            class="text-sm text-[#11141A]/80 font-bold tracking-wide border-l-[3px] border-[#2563EB] pl-2 text-left mx-2 mt-1"
          >
            {m_data.subTitle}
          </p>
        {/if}
      </div>

      <!-- Guess Display & Slider Card -->
      <div
        class="bg-white border-[2.5px] border-[#11141A] shadow-[4px_4px_0px_#11141A] p-5 rounded-xl space-y-6"
      >
        <div class="text-center">
          <span
            class="text-[11px] font-black uppercase tracking-widest text-[#11141A]/60"
            >Your Estimate</span
          >
          <div
            class="text-6xl font-black tracking-tight text-[#11141A] mt-1 flex items-center justify-center font-mono"
          >
            <span>{guessValue}</span>
            <span class="text-3xl text-[#2563EB] font-black ml-1">%</span>
          </div>
        </div>

        <!-- Slider Track -->
        <div class="space-y-3">
          <div class="py-2 relative flex items-center w-full">
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
            class="flex justify-between text-[11px] font-black text-[#11141A]/70 px-1 tracking-wider uppercase"
          >
            <span>NO (1%)</span>
            <span>UNSURE (50%)</span>
            <span>YES (99%)</span>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="px-1">
        <button
          on:click={submitGuess}
          class="w-full py-4 bg-[#11141A] hover:bg-[#2563EB] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-white font-black tracking-widest uppercase rounded-lg text-sm border-[2.5px] border-[#11141A] shadow-[4px_4px_0px_#11141A] transition-all cursor-pointer"
        >
          Lock In Estimate
        </button>
      </div>
    </div>
  {:else}
    <div
      class="w-full bg-white border-[2.5px] border-[#11141A] shadow-[4px_4px_0px_#11141A] rounded-xl flex flex-col items-center justify-center text-center gap-5 p-8 my-auto"
      in:scale={{ duration: 400, start: 0.9 }}
    >
      <div
        class="w-16 h-16 bg-[#FFC82C] border-[2.5px] border-[#11141A] shadow-[3px_3px_0px_#11141A] rounded-full flex items-center justify-center text-[#11141A]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8"
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
        <h2
          class="text-2xl font-black text-[#11141A] uppercase tracking-tight"
        >
          Estimate Locked!
        </h2>
        <p class="text-[#11141A]/80 text-sm font-bold">
          Your estimate of <strong class="text-[#2563EB] text-xl font-black"
            >{guessValue}%</strong
          > is registered.
        </p>
        <p
          class="text-[#11141A]/50 text-xs font-black uppercase tracking-widest pt-2"
        >
          Look at the TV screen...
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Customizing range inputs inside webkit/moz browsers — Bauhaus ruler track */
  input[type="range"]::-webkit-slider-runnable-track {
    background: #11141A;
    height: 6px;
    border-radius: 3px;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #FFC82C;
    border: 2.5px solid #11141A;
    box-shadow: 2px 2px 0px #11141A;
    cursor: pointer;
    margin-top: -11px;
    transition: transform 0.1s, background-color 0.1s;
  }
  input[type="range"]::-webkit-slider-thumb:active {
    transform: scale(1.15);
    background: #2563EB;
  }
  input[type="range"]::-moz-range-track {
    background: #11141A;
    height: 6px;
    border-radius: 3px;
  }
  input[type="range"]::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #FFC82C;
    border: 2.5px solid #11141A;
    box-shadow: 2px 2px 0px #11141A;
    cursor: pointer;
  }
</style>
