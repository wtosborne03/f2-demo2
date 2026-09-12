<script lang="ts">
  import type { RouletteData } from "../types/page_data";
  import { toaster } from "$lib/util/toaster";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { isKeyboardVisible } from "$lib/stores/keyboard";
  import { get } from "svelte/store";
  import { fade } from "svelte/transition";

  const gs = get(gameState);
  const m_data: RouletteData = gs.page_data;

  let punishmentText = "";
  let isSubmitted = false;
  let inputElement: HTMLTextAreaElement;

  const shuffle = (array: string[]) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildSuggestions = (): string[] => {
    const pool = [
      "Take 3 drinks",
      "Take 5 drinks",
      "Down your drink",
      "Take a shot",
      "Shotgun a drink",
      "Give player on left a compliment",
      "Show last photo in camera roll",
      "Let player on right text on your phone",
      "Do 10 pushups or drink 5",
      "Reveal daily phone screen time",
      "Take 6 drinks if you've lost money gambling",
      "Swap an article of clothing",
      "Speak in a British accent until next round",
      "Name a law that you have broken",
      "Take 5 drinks if you're single",
      "Do your best celebrity impression",
      "Confess an embarrassing dating story",
      "Arm wrestle host or drink 4",
      "Take 4 drinks if unemployed",
      "High-five everyone in 5 seconds",
      "Let the group make your next drink",
      "Text your ex 'I miss you' or down drink",
      "Post a random selfie on your story",
      "Whisper everything until next round",
      "Give a 30s toast to yourself",
    ];

    if (m_data?.players && m_data.players.length > 0) {
      const p1 = m_data.players[0];
      pool.unshift(`Give ${p1} your drink for 1 turn`);
      pool.unshift(`Give ${p1} a sincere compliment`);
      pool.unshift(`Rock-paper-scissors with ${p1} (loser drinks 4)`);
    }

    return pool;
  };

  let allSuggestions = buildSuggestions();
  let displayedSuggestions: string[] = shuffle(allSuggestions).slice(0, 8);

  function refreshSuggestions() {
    displayedSuggestions = shuffle(allSuggestions).slice(0, 8);
  }

  function selectSuggestion(suggestion: string) {
    punishmentText = suggestion;
    inputElement?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPunishment();
    }
  }

  function submitPunishment() {
    const trimmed = punishmentText.trim();
    if (!trimmed || isSubmitted) {
      toaster.error({
        title: "Empty Punishment",
        description: "Please enter a punishment or pick a suggestion!",
      });
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    isKeyboardVisible.set(false);

    isSubmitted = true;
    gameClient.sendPlayerInput("roulette", {
      challenge: trimmed,
    });
  }
</script>

<div class="w-full max-w-md mx-auto p-4 flex flex-col gap-4 text-white">
  <!-- Minimal Header -->
  <div class="text-center space-y-1">
    <h1 class="text-xl font-bold tracking-tight">Add a Punishment</h1>
    {#if !$isKeyboardVisible}
      <p class="text-xs text-slate-400">
        Enter a dare or pick a suggestion below.
      </p>
    {/if}
  </div>

  {#if !isSubmitted}
    <!-- Solid Input Box (No nested frames) -->
    <div
      class="flex flex-col bg-slate-800 rounded-xl p-3 border border-slate-700"
    >
      <div class="relative">
        <textarea
          id="punishment-input"
          bind:this={inputElement}
          bind:value={punishmentText}
          on:keydown={handleKeydown}
          maxlength={90}
          rows={3}
          autocomplete="off"
          enterkeyhint="done"
          placeholder="e.g. Take 4 drinks while doing pushups..."
          class="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none pr-6 leading-relaxed"
        ></textarea>

        {#if punishmentText.length > 0}
          <button
            type="button"
            class="absolute top-0 right-0 text-slate-400 hover:text-white text-xs font-bold p-1"
            on:click={() => {
              punishmentText = "";
              inputElement?.focus();
            }}
            aria-label="Clear"
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="flex justify-end pt-2 border-t border-slate-700/60">
        <span class="text-[11px] font-mono text-slate-400">
          {punishmentText.length}/90
        </span>
      </div>
    </div>

    <!-- Solid Chips Section -->
    <div class="space-y-2">
      <div
        class="flex items-center justify-between text-xs text-slate-400 font-medium px-0.5"
      >
        <span>Suggestions</span>
        <button
          type="button"
          class="text-indigo-400 hover:text-indigo-300 transition-colors"
          on:click={refreshSuggestions}
        >
          Shuffle
        </button>
      </div>

      <div
        class="flex flex-row overflow-x-auto gap-2 pb-1 no-scrollbar touch-pan-x"
      >
        {#each displayedSuggestions as suggestion (suggestion)}
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 whitespace-nowrap transition-colors {punishmentText ===
            suggestion
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:bg-slate-600'}"
            on:click={() => selectSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    </div>

    <!-- Solid Action Button -->
    <button
      type="button"
      class="w-full py-3 px-4 font-semibold text-sm rounded-xl transition-all {punishmentText.trim()
        .length > 0
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-[0.99]'
        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}"
      on:click={submitPunishment}
      disabled={punishmentText.trim().length === 0}
    >
      Place on Wheel
    </button>
  {:else}
    <!-- Confirmation View -->
    <div
      in:fade={{ duration: 200 }}
      class="flex flex-col items-center text-center p-6 bg-slate-800 border border-slate-700 rounded-xl space-y-3"
    >
      <div class="text-2xl">✓</div>
      <div class="font-bold text-lg">Punishment Locked In</div>
      <div
        class="p-3 bg-slate-900 rounded-lg text-sm text-slate-200 w-full break-words border border-slate-700/50"
      >
        "{punishmentText}"
      </div>
      <p class="text-xs text-slate-400">Watch the screen for the wheel spin.</p>
    </div>
  {/if}
</div>

<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
