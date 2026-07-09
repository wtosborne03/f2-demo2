<script lang="ts">
  import { get } from "svelte/store";
  import {
    gameClient,
    gameState,
  } from "$lib/wsapi/gameClient";
  import { onMount } from "svelte";

  $: subState = $gameState.page_data?.subState || "listening";
  $: title = $gameState.page_data?.title || "Music Video";
  $: thumbnail = $gameState.page_data?.thumbnail || "";
  $: prompt = $gameState.page_data?.prompt || "";
  $: options = $gameState.page_data?.options || [];
  $: correctAnswer = $gameState.page_data?.correctAnswer || "";
  $: selectedAnswer = $gameState.page_data?.selectedAnswer || "";
  $: isCorrect = $gameState.page_data?.isCorrect === true;
  $: pointsGained = $gameState.page_data?.pointsGained || 0;
  $: roundScore = $gameState.page_data?.roundScore || 0;

  function submitAnswer(answer: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    gameClient.sendInput({
      type: "submit_lyric_answer",
      answer,
    });
  }

  const optionLabels = ["A", "B", "C", "D"];
</script>

<div class="gameplay-container text-white select-none beathop-play-page flex flex-col justify-between h-full w-full p-6">
  
  <!-- Top Section: Header & Song Metadata -->
  <header class="w-full flex items-center gap-4 bg-zinc-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-md">
    {#if thumbnail}
      <img
        src={thumbnail}
        alt="Video Thumbnail"
        class="w-16 h-12 object-cover rounded-lg border border-white/10"
      />
    {:else}
      <div class="w-16 h-12 flex justify-center items-center bg-purple-950/50 rounded-lg border border-purple-500/20">
        <span class="text-xl">🎵</span>
      </div>
    {/if}
    <div class="flex-1 min-w-0">
      <span class="text-[9px] text-purple-400 font-extrabold uppercase tracking-widest block">Lyric Challenge</span>
      <h2 class="text-sm font-bold text-zinc-100 truncate mt-0.5">{title}</h2>
      <div class="text-[10px] text-zinc-400 font-medium mt-0.5">Round Score: {roundScore} pts</div>
    </div>
  </header>

  <!-- Middle Section: Dynamic state-based layouts -->
  <main class="flex-1 flex flex-col justify-center items-center w-full my-6 overflow-y-auto">
    
    <!-- 1. LISTENING STATE -->
    {#if subState === "listening"}
      <div class="flex flex-col items-center text-center animate-fade-in p-4 w-full">
        <!-- Equalizer animation -->
        <div class="listening-eq flex items-end gap-2 h-16 w-32 justify-center mb-8">
          {#each [1, 2, 3, 4, 5, 6] as bar}
            <span class="eq-bar eq-bar-{bar} w-1.5 bg-gradient-to-t from-purple-500 via-pink-500 to-amber-400 rounded-full"></span>
          {/each}
        </div>
        <h1 class="text-xl font-black tracking-wide uppercase text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
          Listen Carefully!
        </h1>
        <p class="text-zinc-400 text-sm mt-3 max-w-xs leading-relaxed">
          The song is playing on the big screen. Follow the lyrics closely!
        </p>
      </div>

    <!-- 2. QUESTION PROMPTING STATE -->
    {:else if subState === "question"}
      <div class="flex flex-col items-center w-full animate-fade-in gap-5">
        <!-- Question prompt bubble -->
        <div class="w-full bg-zinc-900/60 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg text-center">
          <span class="text-[10px] text-purple-400 font-black uppercase tracking-widest">Complete the line:</span>
          <p class="text-lg font-black text-white leading-relaxed mt-2 italic">
            "{prompt}"
          </p>
        </div>

        <!-- 4 Multiple Choice buttons -->
        <div class="flex flex-col gap-3 w-full max-w-md">
          {#each options as option, idx}
            <button
              class="option-btn flex items-center gap-4 w-full p-4 bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-2xl text-left transition-all active:scale-95 duration-100"
              on:click={() => submitAnswer(option)}
            >
              <span class="option-badge flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs bg-purple-950 text-purple-300 border border-purple-500/25 shrink-0">
                {optionLabels[idx]}
              </span>
              <span class="text-sm font-extrabold text-zinc-100 truncate line-clamp-1">{option}</span>
            </button>
          {/each}
        </div>
      </div>

    <!-- 3. ANSWERED / WAITING STATE -->
    {:else if subState === "answered"}
      <div class="flex flex-col items-center text-center animate-fade-in p-4">
        <div class="pulse-ring-loader mb-8">
          <div class="inner-loader-circle">✓</div>
        </div>
        <h1 class="text-lg font-black uppercase tracking-wider text-emerald-400">
          Answer Submitted!
        </h1>
        <p class="text-zinc-400 text-sm mt-2 max-w-xs leading-relaxed">
          Waiting for other players to finish their guesses...
        </p>
        {#if selectedAnswer}
          <div class="mt-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl max-w-xs text-xs font-semibold text-zinc-300 truncate">
            Your guess: <span class="text-purple-300">"{selectedAnswer}"</span>
          </div>
        {/if}
      </div>

    <!-- 4. OUTCOME STATE (CORRECT/INCORRECT) -->
    {:else if subState === "outcome"}
      <div class="flex flex-col items-center text-center w-full animate-fade-in p-4 gap-6">
        
        {#if isCorrect}
          <!-- Correct outcome -->
          <div class="flex flex-col items-center">
            <div class="outcome-success-ring mb-4">
              <span class="text-3xl">✓</span>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              Correct!
            </h1>
            <span class="text-xl font-extrabold text-white mt-2 animate-bounce">
              +{pointsGained} PTS
            </span>
          </div>
        {:else}
          <!-- Incorrect outcome -->
          <div class="flex flex-col items-center w-full">
            <div class="outcome-fail-ring mb-4">
              <span class="text-3xl">✗</span>
            </div>
            <h1 class="text-3xl font-black uppercase tracking-widest text-rose-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              Incorrect
            </h1>
            <span class="text-sm font-extrabold text-zinc-500 mt-2">
              +0 PTS
            </span>
          </div>
        {/if}

        <!-- Lyric details card -->
        <div class="w-full max-w-md bg-zinc-950/50 border border-white/5 rounded-2xl p-5 mt-4 text-left flex flex-col gap-3">
          <div>
            <span class="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest block">Original Prompt:</span>
            <p class="text-xs text-zinc-400 italic mt-0.5">"{prompt}"</p>
          </div>
          
          <div class="border-t border-white/5 pt-3">
            <span class="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block">Correct Lyrics:</span>
            <p class="text-sm font-bold text-emerald-400 mt-0.5">"{correctAnswer}"</p>
          </div>

          {#if !isCorrect && selectedAnswer}
            <div class="border-t border-white/5 pt-3">
              <span class="text-[9px] text-rose-400 font-extrabold uppercase tracking-widest block">Your Guess:</span>
              <p class="text-sm font-bold text-rose-400 mt-0.5 line-through">"{selectedAnswer}"</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}

  </main>

  <!-- Bottom Section: Info Footer -->
  <footer class="w-full flex justify-center py-2">
    <p class="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase bg-zinc-950/20 px-4 py-2 rounded-full border border-white/5">
      BeatHop: Lyric Edition
    </p>
  </footer>

</div>

<style>
  .gameplay-container {
    height: 100%;
    box-sizing: border-box;
    font-family: "Inter", system-ui, sans-serif;
    background-color: #0b0a0f !important;
  }
  :global(body:has(.beathop-play-page)) {
    background-color: #0b0a0f !important;
  }

  /* Equalizer Animation */
  .listening-eq {
    perspective: 1000px;
  }

  .eq-bar {
    height: 100%;
    transform-origin: bottom;
    animation: eqPulse 1s ease-in-out infinite alternate;
  }

  .eq-bar-1 { animation-duration: 0.6s; animation-delay: 0.1s; }
  .eq-bar-2 { animation-duration: 0.8s; animation-delay: 0.3s; }
  .eq-bar-3 { animation-duration: 0.5s; animation-delay: 0.0s; }
  .eq-bar-4 { animation-duration: 0.9s; animation-delay: 0.4s; }
  .eq-bar-5 { animation-duration: 0.7s; animation-delay: 0.2s; }
  .eq-bar-6 { animation-duration: 0.6s; animation-delay: 0.5s; }

  @keyframes eqPulse {
    0% { transform: scaleY(0.15); }
    100% { transform: scaleY(1); }
  }

  /* Fade-in Animation */
  .animate-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Pulse Ring Loader */
  .pulse-ring-loader {
    position: relative;
    width: 64px;
    height: 64px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pulse-ring-loader::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(16, 185, 129, 0.2);
    animation: pulseLoaderRing 1.8s ease-out infinite;
  }

  .inner-loader-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.25rem;
    font-weight: bold;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    z-index: 2;
  }

  @keyframes pulseLoaderRing {
    0% {
      transform: scale(0.8);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }

  /* Outcome Success Ring */
  .outcome-success-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
  }

  /* Outcome Fail Ring */
  .outcome-fail-ring {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #ef4444;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.5);
  }

  /* Option Buttons Styling */
  .option-btn {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
</style>
