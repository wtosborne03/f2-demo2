<script lang="ts">
  import type { RouletteData } from "../types/page_data";
  import { toaster } from "$lib/util/toaster";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";
  import { fly, fade } from "svelte/transition";

  const gs = get(gameState);
  const m_data: RouletteData = gs.page_data;

  let punishmentText = "";
  let isSubmitted = false;
  let inputElement: HTMLTextAreaElement | HTMLInputElement;

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
      "Shotgun a beer or seltzer",
      "Give the player on your left a compliment",
      "Show the last photo in your camera roll",
      "Let the person on your right text anyone on your phone",
      "Do 10 pushups or take 5 drinks",
      "Reveal your phone's daily screen time",
      "Take 6 drinks if you've lost money gambling",
      "Swap an article of clothing with someone",
      "Speak in a British accent until next round",
      "Name a law that you have broken",
      "Take 5 drinks if you're single",
      "Do your best celebrity impression",
      "Confess your most embarrassing dating story",
      "Arm wrestle the host or drink 4",
      "Take 4 drinks if you're currently unemployed",
      "High-five everyone in the room in 5 seconds",
      "Let the group make your next drink",
      "Text your ex 'I miss you' or down your drink",
      "Post a random selfie on your story",
      "Whisper everything you say until next round",
      "Give a 30-second toast celebrating yourself",
    ];

    if (m_data?.players && m_data.players.length > 0) {
      const p1 = m_data.players[0];
      pool.unshift(`Give ${p1} your drink for 1 turn`);
      pool.unshift(`Give ${p1} a compliment`);
      pool.unshift(`Challenge ${p1} to rock-paper-scissors (loser drinks 4)`);
    }

    return pool;
  };

  let allSuggestions = buildSuggestions();
  let displayedSuggestions: string[] = shuffle(allSuggestions).slice(0, 4);

  function refreshSuggestions() {
    displayedSuggestions = shuffle(allSuggestions).slice(0, 4);
  }

  function selectSuggestion(suggestion: string) {
    punishmentText = suggestion;
    if (inputElement) {
      inputElement.focus();
    }
  }

  function getSuggestionEmoji(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("shotgun")) return "⚡";
    if (lower.includes("shot")) return "🥃";
    if (lower.includes("down") || lower.includes("drink") || lower.includes("cup") || lower.includes("beer")) return "🍺";
    if (lower.includes("compliment") || lower.includes("toast") || lower.includes("speech")) return "💬";
    if (lower.includes("wallet") || lower.includes("money") || lower.includes("gambl")) return "💸";
    if (lower.includes("cloth") || lower.includes("swap") || lower.includes("shirt")) return "👕";
    if (lower.includes("law") || lower.includes("crime")) return "⚖️";
    if (lower.includes("text") || lower.includes("phone") || lower.includes("story") || lower.includes("post")) return "📱";
    if (lower.includes("pushup") || lower.includes("arm wrestle") || lower.includes("high-five")) return "💪";
    if (lower.includes("photo") || lower.includes("camera") || lower.includes("selfie")) return "📸";
    if (lower.includes("screentime") || lower.includes("screen")) return "⏱️";
    if (lower.includes("accent") || lower.includes("whisper") || lower.includes("impression")) return "🗣️";
    if (lower.includes("secret") || lower.includes("dating") || lower.includes("confess")) return "🤫";
    return "🔥";
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

    isSubmitted = true;
    gameClient.sendPlayerInput("roulette", {
      challenge: trimmed,
    });
  }
</script>

<div class="w-full max-w-md mx-auto p-2 text-[var(--m3c-on-surface)] flex flex-col gap-4">
  <!-- Title / Header -->
  <div class="text-center space-y-1">
    <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/15 text-red-500 font-black text-xs uppercase tracking-widest rounded-full border border-red-500/30">
      <span>🎰</span>
      <span>Roulette Dare</span>
    </div>
    <h1 class="text-2xl font-black tracking-tight text-[var(--m3c-on-surface)]">
      Add a Punishment to the Wheel
    </h1>
    <p class="text-sm text-[var(--m3c-on-surface-variant)]">
      Type a custom dare or pick a suggestion below. The AI will fit it onto the roulette wheel!
    </p>
  </div>

  {#if !isSubmitted}
    <!-- Input Card -->
    <div class="flex flex-col gap-2 p-4 rounded-3xl bg-[var(--m3c-surface-container-low)] border-2 border-[var(--m3c-outline-variant)] shadow-sm">
      <div class="flex items-center justify-between">
        <label for="punishment-input" class="text-xs font-bold uppercase tracking-wider text-[var(--m3c-on-surface-variant)]">
          Your Custom Punishment:
        </label>
        <span class="text-xs font-mono font-medium text-[var(--m3c-on-surface-variant)]">
          {punishmentText.length}/90
        </span>
      </div>

      <div class="relative w-full">
        <textarea
          id="punishment-input"
          bind:this={inputElement}
          bind:value={punishmentText}
          maxlength={90}
          rows={3}
          placeholder="e.g., Take 4 drinks while doing pushups, swap shirts, text your ex..."
          class="w-full p-3.5 pr-10 text-base font-semibold rounded-2xl bg-[var(--m3c-surface-container-highest)] border border-[var(--m3c-outline)] text-[var(--m3c-on-surface)] placeholder:text-[var(--m3c-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--m3c-primary)] resize-none transition-all leading-snug"
        ></textarea>

        {#if punishmentText.length > 0}
          <button
            type="button"
            class="absolute top-3 right-3 w-7 h-7 rounded-full bg-[var(--m3c-surface-variant)] text-[var(--m3c-on-surface-variant)] flex items-center justify-center text-xs font-bold hover:bg-[var(--m3c-outline)] transition-colors cursor-pointer"
            on:click={() => { punishmentText = ""; if (inputElement) inputElement.focus(); }}
            aria-label="Clear input"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>

    <!-- Suggestions Section -->
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold uppercase tracking-wider text-[var(--m3c-on-surface-variant)] flex items-center gap-1">
          <span>💡</span> Quick Suggestions
        </span>
        <button
          type="button"
          class="text-xs font-bold text-[var(--m3c-primary)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-1"
          on:click={refreshSuggestions}
        >
          <span>🎲</span> Shuffle
        </button>
      </div>

      <div class="grid grid-cols-1 gap-2">
        {#each displayedSuggestions as suggestion, i (suggestion)}
          <button
            type="button"
            in:fly={{ y: 10, delay: i * 40, duration: 200 }}
            class="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer {punishmentText === suggestion
              ? 'bg-[var(--m3c-primary-container)] border-[var(--m3c-primary)] text-[var(--m3c-on-primary-container)] shadow-sm'
              : 'bg-[var(--m3c-surface-container-low)] border-[var(--m3c-outline-variant)] text-[var(--m3c-on-surface)] hover:bg-[var(--m3c-surface-container-high)] active:scale-[0.99]'}"
            on:click={() => selectSuggestion(suggestion)}
          >
            <span class="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--m3c-surface-container-highest)] text-base shrink-0 select-none">
              {getSuggestionEmoji(suggestion)}
            </span>
            <span class="flex-1 text-sm font-semibold leading-tight line-clamp-2">
              {suggestion}
            </span>
            {#if punishmentText === suggestion}
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--m3c-primary)] text-[var(--m3c-on-primary)] shrink-0">
                Selected
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="button"
      class="w-full py-4 px-6 font-black text-lg rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md {punishmentText.trim().length > 0
        ? 'bg-[var(--m3c-primary)] text-[var(--m3c-on-primary)] hover:brightness-110 active:scale-[0.98]'
        : 'bg-[var(--m3c-surface-variant)] text-[var(--m3c-on-surface-variant)] opacity-50 cursor-not-allowed pointer-events-none'}"
      on:click={submitPunishment}
      disabled={punishmentText.trim().length === 0}
    >
      <span>Place on Wheel</span>
      <span class="text-xl">🔥</span>
    </button>
  {:else}
    <!-- Locked-In Confirmation Card -->
    <div
      in:fade={{ duration: 250 }}
      class="w-full flex flex-col items-center justify-center p-6 text-center bg-[var(--m3c-surface-container-low)] border-2 border-[var(--m3c-primary)] rounded-3xl shadow-lg gap-3"
    >
      <div class="w-16 h-16 rounded-full bg-[var(--m3c-primary-container)] text-[var(--m3c-on-primary-container)] flex items-center justify-center text-3xl shadow-inner animate-bounce">
        🎯
      </div>
      <div class="font-black text-2xl uppercase tracking-tight text-[var(--m3c-on-surface)]">
        Punishment Locked In!
      </div>
      <div class="px-4 py-3 rounded-2xl bg-[var(--m3c-surface-container-highest)] border border-[var(--m3c-outline-variant)] text-base font-bold text-[var(--m3c-on-surface)] w-full break-words">
        "{punishmentText}"
      </div>
      <p class="text-xs font-semibold uppercase tracking-widest text-[var(--m3c-on-surface-variant)] mt-2">
        👀 Watch the TV screen to see the wheel spin!
      </p>
    </div>
  {/if}
</div>
