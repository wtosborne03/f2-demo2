<script lang="ts">
  import type { RouletteData } from "../types/page_data";
  import { toaster } from "$lib/util/toaster";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { isKeyboardVisible } from "$lib/stores/keyboard";
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

    isSubmitted = true;
    gameClient.sendPlayerInput("roulette", {
      challenge: trimmed,
    });
  }
</script>

<div class="w-full max-w-md mx-auto px-3 py-1 text-[var(--m3c-on-surface)] flex flex-col gap-2.5 sm:gap-4 select-none">
  <!-- Header (Ultra compact when keyboard is active) -->
  <div class="text-center space-y-0.5 sm:space-y-1">
    <div class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-600/15 text-red-500 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-full border border-red-500/30">
      <span>🎰</span>
      <span>Roulette Dare</span>
    </div>
    <h1 class="text-xl sm:text-2xl font-black tracking-tight text-[var(--m3c-on-surface)] leading-tight">
      Add a Punishment to the Wheel
    </h1>
    {#if !$isKeyboardVisible}
      <p class="text-xs text-[var(--m3c-on-surface-variant)] leading-snug">
        Type a custom dare or tap a suggestion below. The AI will fit it onto the roulette wheel!
      </p>
    {/if}
  </div>

  {#if !isSubmitted}
    <!-- Input Card -->
    <div class="flex flex-col gap-1.5 p-3 rounded-2xl bg-[var(--m3c-surface-container-low)] border-2 border-[var(--m3c-outline-variant)] shadow-sm">
      <div class="flex items-center justify-between px-0.5">
        <label for="punishment-input" class="text-[11px] font-bold uppercase tracking-wider text-[var(--m3c-on-surface-variant)]">
          Custom Punishment:
        </label>
        <span class="text-[11px] font-mono font-medium text-[var(--m3c-on-surface-variant)]">
          {punishmentText.length}/90
        </span>
      </div>

      <div class="relative w-full">
        <textarea
          id="punishment-input"
          bind:this={inputElement}
          bind:value={punishmentText}
          on:keydown={handleKeydown}
          on:focus={() => isKeyboardVisible.set(true)}
          on:blur={() => {
            setTimeout(() => {
              const el = document.activeElement;
              if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) {
                isKeyboardVisible.set(false);
              }
            }, 80);
          }}
          maxlength={90}
          rows={2}
          autocomplete="off"
          autocapitalize="sentences"
          enterkeyhint="done"
          placeholder="e.g., Take 4 drinks while doing pushups, swap shirts..."
          class="w-full p-2.5 pr-8 text-sm sm:text-base font-semibold rounded-xl bg-[var(--m3c-surface-container-highest)] border border-[var(--m3c-outline)] text-[var(--m3c-on-surface)] placeholder:text-[var(--m3c-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--m3c-primary)] resize-none transition-all leading-snug"
        ></textarea>

        {#if punishmentText.length > 0}
          <button
            type="button"
            class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[var(--m3c-surface-variant)] text-[var(--m3c-on-surface-variant)] flex items-center justify-center text-xs font-bold hover:bg-[var(--m3c-outline)] transition-colors cursor-pointer"
            on:click={() => { punishmentText = ""; if (inputElement) inputElement.focus(); }}
            aria-label="Clear input"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>

    <!-- Suggestions Section (Horizontal Scrollable Chips) -->
    <div class="flex flex-col gap-1">
      <div class="flex items-center justify-between px-1">
        <span class="text-[11px] font-bold uppercase tracking-wider text-[var(--m3c-on-surface-variant)] flex items-center gap-1">
          <span>💡</span> Quick Suggestions
        </span>
        <button
          type="button"
          class="text-[11px] font-bold text-[var(--m3c-primary)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0.5"
          on:click={refreshSuggestions}
        >
          <span>🎲</span> Shuffle
        </button>
      </div>

      <!-- Horizontal scroll container -->
      <div class="flex flex-row overflow-x-auto gap-1.5 py-1 -mx-1 px-1 no-scrollbar touch-pan-x">
        {#each displayedSuggestions as suggestion (suggestion)}
          <button
            type="button"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-left shrink-0 transition-all duration-150 cursor-pointer text-xs font-semibold whitespace-nowrap {punishmentText === suggestion
              ? 'bg-[var(--m3c-primary-container)] border-[var(--m3c-primary)] text-[var(--m3c-on-primary-container)] shadow-sm'
              : 'bg-[var(--m3c-surface-container-low)] border-[var(--m3c-outline-variant)] text-[var(--m3c-on-surface)] hover:bg-[var(--m3c-surface-container-high)] active:scale-95'}"
            on:click={() => selectSuggestion(suggestion)}
          >
            <span class="text-sm select-none">{getSuggestionEmoji(suggestion)}</span>
            <span class="max-w-[210px] truncate">{suggestion}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="button"
      class="w-full py-3.5 px-4 font-black text-base sm:text-lg rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md {punishmentText.trim().length > 0
        ? 'bg-[var(--m3c-primary)] text-[var(--m3c-on-primary)] hover:brightness-110 active:scale-[0.98]'
        : 'bg-[var(--m3c-surface-variant)] text-[var(--m3c-on-surface-variant)] opacity-50 cursor-not-allowed pointer-events-none'}"
      on:click={submitPunishment}
      disabled={punishmentText.trim().length === 0}
    >
      <span>Place on Wheel</span>
      <span class="text-lg">🔥</span>
    </button>
  {:else}
    <!-- Locked-In Confirmation Card -->
    <div
      in:fade={{ duration: 250 }}
      class="w-full flex flex-col items-center justify-center p-6 text-center bg-[var(--m3c-surface-container-low)] border-2 border-[var(--m3c-primary)] rounded-3xl shadow-lg gap-3"
    >
      <div class="w-14 h-14 rounded-full bg-[var(--m3c-primary-container)] text-[var(--m3c-on-primary-container)] flex items-center justify-center text-3xl shadow-inner animate-bounce">
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

<style>
  /* Hide scrollbar for horizontal chips */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
