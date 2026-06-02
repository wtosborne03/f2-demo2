<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale, fade } from "svelte/transition";
  import { onMount } from "svelte";

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
      guess: guessValue
    });
  }

  function adjustGuess(amount: number) {
    if (submitted) return;
    guessValue = Math.max(1, Math.min(99, guessValue + amount));
  }
</script>

<div class="w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between p-6 text-white font-sans">
  {#if !submitted}
    <div class="flex-grow flex flex-col justify-between py-4 max-w-md mx-auto w-full" in:scale={{ duration: 300 }}>
      
      <!-- Category Badge & Header -->
      <div class="text-center space-y-2">
        <span class="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wider uppercase rounded-full">
          {m_data.category || "Prediction Market"}
        </span>
        <h1 class="text-xl sm:text-2xl font-black leading-tight text-slate-100 px-2 mt-2">
          {m_data.question || "Will the event happen?"}
        </h1>
        {#if m_data.subTitle}
          <p class="text-xs text-slate-400 font-medium tracking-wide">
            {m_data.subTitle}
          </p>
        {/if}
      </div>

      <!-- Image Area (if any) -->
      {#if m_data.imageUrl && !imgFailed}
        <div class="my-4 flex justify-center" transition:fade>
          <img 
            src={m_data.imageUrl} 
            alt="Market illustration" 
            on:error={() => imgFailed = true}
            class="w-24 h-24 rounded-2xl object-cover border border-slate-800 shadow-xl"
          />
        </div>
      {/if}

      <!-- Guess Display & Slider -->
      <div class="space-y-6 bg-slate-900/40 border border-slate-900/60 p-6 rounded-3xl my-4">
        <div class="text-center">
          <p class="text-xs font-bold tracking-widest text-slate-500 uppercase">Your Estimate</p>
          <div class="text-6xl font-black tracking-tight text-emerald-400 mt-2 flex items-center justify-center">
            <span>{guessValue}</span>
            <span class="text-3xl text-emerald-500/60 font-medium ml-1">%</span>
          </div>
          <p class="text-xs text-slate-400 mt-1">probability of happening</p>
        </div>

        <!-- Fine Tuning Controls + Slider -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <button 
              on:click={() => adjustGuess(-5)}
              class="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center text-sm border border-slate-700"
            >
              -5
            </button>
            <button 
              on:click={() => adjustGuess(-1)}
              class="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center text-sm border border-slate-700"
            >
              -1
            </button>

            <!-- Custom Styled Slider Track -->
            <div class="flex-grow px-2 py-4 relative flex items-center">
              <input 
                type="range" 
                min="1" 
                max="99" 
                bind:value={guessValue}
                class="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
            </div>

            <button 
              on:click={() => adjustGuess(1)}
              class="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center text-sm border border-slate-700"
            >
              +1
            </button>
            <button 
              on:click={() => adjustGuess(5)}
              class="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-black hover:bg-slate-700 active:scale-90 transition-all flex items-center justify-center text-sm border border-slate-700"
            >
              +5
            </button>
          </div>

          <!-- Ticks description -->
          <div class="flex justify-between text-[10px] font-bold text-slate-500 px-2">
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
          class="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-98 transition-all text-slate-950 font-black tracking-wider uppercase rounded-2xl shadow-lg shadow-emerald-500/20 text-center text-sm"
        >
          Lock In Guess
        </button>
      </div>

    </div>
  {:else}
    <div class="flex-grow flex flex-col items-center justify-center text-center space-y-6" in:scale={{ duration: 400, start: 0.9 }}>
      <div class="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shadow-lg border border-emerald-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div class="space-y-2">
        <h2 class="text-2xl font-bold text-slate-100">Estimate Locked!</h2>
        <p class="text-slate-400 text-sm">Your guess of <strong class="text-emerald-400 text-lg font-black">{guessValue}%</strong> is registered.</p>
        <p class="text-slate-500 text-xs mt-2">Waiting for other players to submit...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Customizing standard range inputs inside webkit/moz browsers */
  input[type="range"]::-webkit-slider-runnable-track {
    background: #1e293b;
    height: 12px;
    border-radius: 9999px;
    border: 1px solid #334155;
  }
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    margin-top: -6px;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    border: 2px solid #ffffff;
    transition: transform 0.1s;
  }
  input[type="range"]::-webkit-slider-thumb:active {
    transform: scale(1.2);
  }
  input[type="range"]::-moz-range-track {
    background: #1e293b;
    height: 12px;
    border-radius: 9999px;
    border: 1px solid #334155;
  }
  input[type="range"]::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    border: 2px solid #ffffff;
  }
</style>
