<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

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

  $: selectedIdx = options.indexOf(selectedAnswer);

  function submitAnswer(answer: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    gameClient.sendInput({
      type: "submit_lyric_answer",
      answer,
    });
  }

  // daisyUI colors mapping: rose, blue, green, amber
  const optionBtnClasses = ["btn-error", "btn-info", "btn-success", "btn-warning"];
  const optionBgClasses = ["bg-error/20 border-error/30 text-error-content", "bg-info/20 border-info/30 text-info-content", "bg-success/20 border-success/30 text-success-content", "bg-warning/20 border-warning/30 text-warning-content"];
</script>

<div class="flex flex-col justify-start items-center h-full w-full max-w-md mx-auto px-6 py-6 space-y-6">
  <!-- Sleek Header -->
  <header class="flex justify-between items-center border-b border-base-300 pb-3 w-full gap-4 flex-shrink-0">
    <div class="flex-grow min-w-0">
      <h2 class="text-xl font-black truncate">{title}</h2>
    </div>
    {#if thumbnail}
      <div class="relative w-20 h-11 rounded-lg overflow-hidden border border-base-300 shadow-sm flex-shrink-0">
        <img src={thumbnail} alt="" class="w-full h-full object-cover" />
      </div>
    {/if}
  </header>

  <!-- Main Interaction Area -->
  <main class="w-full flex-grow flex flex-col justify-center items-center">
    {#if subState === "listening"}
      <!-- Listening Mode Visualizer -->
      <div class="flex flex-col items-center text-center gap-4 py-8 w-full">
        <h3 class="text-xl font-bold">Listening closely...</h3>
        <p class="text-xs text-base-content/70">Follow the lyrics on the main screen</p>

        <!-- CSS Audio Visualizer Wave -->
        <div class="eq-visualizer flex items-end gap-1 h-10 mt-4">
          {#each [1, 2, 3, 4, 5, 6, 7] as bar}
            <span
              class="eq-bar w-1 bg-primary rounded-full"
              style="animation-delay: {bar * 0.15}s; height: {30 + (bar % 3) * 25}%"
            ></span>
          {/each}
        </div>
      </div>
    {:else if subState === "question"}
      <!-- Lyric Question Mode -->
      <div class="flex flex-col gap-6 w-full">
        <!-- Prompt Card -->
        <div class="card bg-base-200 border border-base-300 shadow-md p-6 w-full text-center">
          <p class="text-lg font-bold italic leading-relaxed">
            “{prompt}”
          </p>
        </div>

        <!-- 4 Option Grid (Rose, Blue, Green, Amber) -->
        <div class="flex flex-col gap-3 w-full">
          {#each options as option, idx}
            <button
              class="btn {optionBtnClasses[idx]} btn-lg w-full text-base font-black py-4 h-auto leading-snug shadow-md"
              onclick={() => submitAnswer(option)}
            >
              <span>{option}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else if subState === "answered"}
      <!-- Answered and locking state -->
      <div class="flex flex-col items-center text-center gap-4 py-8 w-full">
        <span class="loading loading-spinner loading-lg text-primary"></span>

        <h3 class="text-xl font-bold mt-2">Locked in!</h3>
        <p class="text-xs text-base-content/70">Waiting for other players...</p>

        {#if selectedAnswer}
          <div class="w-full card border p-5 mt-4 rounded-2xl shadow-sm {selectedIdx !== -1 ? optionBgClasses[selectedIdx] : 'bg-base-200 border-base-300'}">
            <span class="text-xs uppercase font-extrabold opacity-60 tracking-wider">Your Guess</span>
            <p class="text-lg font-black italic mt-1 leading-relaxed">“{selectedAnswer}”</p>
          </div>
        {/if}
      </div>
    {:else if subState === "outcome"}
      <!-- Outcome (Correct/Incorrect) State -->
      <div class="flex flex-col items-center gap-6 w-full">
        <div class="flex flex-col items-center text-center gap-2">
          <div class="w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-lg {isCorrect ? 'bg-success/10 border-success/30 text-success' : 'bg-error/10 border-error/30 text-error'}">
            {#if isCorrect}
              <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            {/if}
          </div>
          <h1 class="text-3xl font-black uppercase tracking-wider mt-2 {isCorrect ? 'text-success' : 'text-error'}">
            {isCorrect ? "Correct" : "Incorrect"}
          </h1>
          <span class="text-xl font-bold text-primary tracking-wide">
            {isCorrect ? `+${pointsGained} PTS` : "+0 PTS"}
          </span>
        </div>

        <!-- Detailed Breakdown Card -->
        <div class="card bg-base-200 border border-base-300 shadow-md p-6 w-full text-left space-y-4">
          <div class="flex flex-col">
            <span class="text-xs uppercase font-extrabold opacity-60 tracking-wider">Prompt</span>
            <p class="text-base font-bold italic mt-0.5 leading-relaxed text-base-content/85">“{prompt}”</p>
          </div>

          <div class="border-t border-base-300"></div>

          <div class="flex flex-col pt-1">
            <span class="text-xs uppercase font-extrabold opacity-60 tracking-wider">Correct Answer</span>
            <p class="text-base font-black mt-0.5 text-success leading-relaxed">“{correctAnswer}”</p>
          </div>

          {#if !isCorrect && selectedAnswer}
            <div class="border-t border-base-300"></div>
            <div class="flex flex-col pt-1">
              <span class="text-xs uppercase font-extrabold opacity-60 tracking-wider">Your Guess</span>
              <p class="text-base font-semibold mt-0.5 text-error line-through opacity-80 leading-relaxed">“{selectedAnswer}”</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  @reference "../app.css";

  .eq-bar {
    animation: audioWave 1.2s ease-in-out infinite alternate;
  }

  @keyframes audioWave {
    from {
      transform: scaleY(0.4);
    }
    to {
      transform: scaleY(1);
    }
  }
</style>
