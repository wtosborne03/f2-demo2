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

<div
  class="flex flex-col justify-between h-full w-full p-6 text-black select-none font-sans"
>
  <header
    class="w-full flex items-center justify-between pb-4 border-b border-zinc-800"
  >
    <div class="flex items-center gap-3 min-w-0">
      {#if thumbnail}
        <img
          src={thumbnail}
          alt=""
          class="w-10 h-10 object-cover rounded-md opacity-80"
        />
      {/if}
      <div class="truncate">
        <h2 class="text-sm font-semibold truncate">{title}</h2>
        <p class="text-xs text-zinc-400">Lyric Challenge</p>
      </div>
    </div>
    <div class="text-xs font-medium text-zinc-400 shrink-0">
      Score: <span class="text-zinc-100 font-semibold">{roundScore}</span>
    </div>
  </header>

  <main
    class="flex-1 flex flex-col justify-center items-center w-full my-8 overflow-y-auto"
  >
    {#if subState === "listening"}
      <div
        class="flex flex-col items-center text-center animate-fade-in w-full max-w-xs"
      >
        <div class="flex items-end gap-1 h-8 mb-4">
          {#each [1, 2, 3, 4, 5] as bar}
            <span
              class="w-1 bg-zinc-400 rounded-full animate-pulse"
              style="animation-delay: {bar * 0.15}s; height: {40 +
                (bar % 3) * 30}%"
            ></span>
          {/each}
        </div>
        <p class="text-sm text-zinc-400 leading-relaxed">
          Listen carefully to the main screen...
        </p>
      </div>
    {:else if subState === "question"}
      <div
        class="flex flex-col items-center w-full max-w-md animate-fade-in gap-6"
      >
        <p
          class="text-lg font-medium text-center px-4 leading-normal italic text-zinc-200"
        >
          "{prompt}"
        </p>

        <div class="flex flex-col gap-2 w-full">
          {#each options as option, idx}
            <button
              class="group flex items-center gap-4 w-full p-4 border border-zinc-800 bg-zinc-900/20 rounded-xl transition-all hover:bg-zinc-800/40 active:scale-[0.99]"
              on:click={() => submitAnswer(option)}
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 text-xs font-mono group-hover:bg-zinc-700 group-hover:text-zinc-200 transition-colors"
              >
                {optionLabels[idx]}
              </span>
              <span class="text-sm text-zinc-300 truncate">{option}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else if subState === "answered"}
      <div class="flex flex-col items-center text-center animate-fade-in gap-3">
        <div
          class="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-sm text-zinc-400">Waiting for players...</p>
        {#if selectedAnswer}
          <div class="text-xs text-zinc-500 max-w-xs truncate mt-2">
            Submitted: <span class="text-zinc-400 italic"
              >"{selectedAnswer}"</span
            >
          </div>
        {/if}
      </div>
    {:else if subState === "outcome"}
      <div
        class="flex flex-col items-center text-center w-full max-w-md animate-fade-in gap-6"
      >
        <div>
          <h1
            class="text-2xl font-bold tracking-tight {isCorrect
              ? 'text-emerald-400'
              : 'text-rose-400'}"
          >
            {isCorrect ? "Correct" : "Incorrect"}
          </h1>
          <p class="text-xs text-zinc-400 font-mono mt-1">
            {isCorrect ? `+${pointsGained} PTS` : "+0 PTS"}
          </p>
        </div>

        <div
          class="w-full bg-zinc-900/10 border border-zinc-800 rounded-xl p-4 text-left flex flex-col gap-3 text-xs"
        >
          <div>
            <span class="text-zinc-500 font-medium block mb-0.5">Prompt:</span>
            <p class="text-zinc-400 italic">"{prompt}"</p>
          </div>

          <div class="border-t border-zinc-800/60 pt-3">
            <span class="text-zinc-500 font-medium block mb-0.5">Answer:</span>
            <p class="font-medium text-emerald-400">"{correctAnswer}"</p>
          </div>

          {#if !isCorrect && selectedAnswer}
            <div class="border-t border-zinc-800/60 pt-3">
              <span class="text-zinc-500 font-medium block mb-0.5"
                >Your Guess:</span
              >
              <p class="font-medium text-rose-400/80 line-through">
                "{selectedAnswer}"
              </p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </main>

  <footer class="w-full flex justify-center border-t border-zinc-800/40 pt-4">
    <p class="text-[10px] text-zinc-600 tracking-wider uppercase font-mono">
      BeatHop
    </p>
  </footer>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
