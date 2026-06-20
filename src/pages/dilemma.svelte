<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { derived } from "svelte/store";
  import { onMount, onDestroy } from "svelte";
  import Icon from "@iconify/svelte";

  // Derive page data from the player state
  const pageData = derived(gameState, ($p) => $p?.page_data);
  const points = derived(pageData, ($d) => $d?.points ?? 0);

  // Reactive inputs
  $: inputType = $pageData?.inputType ?? "CHOICES";
  $: options = $pageData?.options ?? [];
  $: slider = $pageData?.slider;

  $: sliderMin = slider?.min ?? 0;
  $: sliderMax = slider?.max ?? 100;
  $: sliderStep = slider?.step ?? 5;
  $: sliderUnit = slider?.unit ?? "";
  $: sliderLeftLabel = slider?.leftLabel ?? "";
  $: sliderRightLabel = slider?.rightLabel ?? "";
  $: submitLabel = $pageData?.submitLabel ?? "Submit Option";

  // Local UI state
  let choice: string | null = null;
  let disabled = false;
  let hintVisible = true;
  let hintTimeoutId: any;
  let sliderValue = 0;

  // Sync initial slider value once page data is loaded
  $: if (slider && sliderValue === 0) {
    sliderValue = slider.min ?? 0;
  }

  function sendChoice(answer: string) {
    if (disabled) return;
    disabled = true;
    choice = answer;

    gameClient.sendPlayerInput("promptTextData", { answer: answer });

    // Hide hint after selection
    hintVisible = false;
  }

  // Allow re-enabling for local dev if needed (no-op if server controls flow)
  onMount(() => {
    // keep hint visible briefly
    hintTimeoutId = setTimeout(() => {
      hintVisible = false;
    }, 7000);
  });

  onDestroy(() => {
    if (hintTimeoutId) clearTimeout(hintTimeoutId);
  });
</script>

<svelte:head>
  <!-- Use the playful font (if available in the project or fallback) -->
  <link
    href="https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div
  class="page-root w-full h-full relative flex flex-col justify-center items-center overflow-y-auto font-dynapuff"
>
  <main
    class="container mx-auto h-fit flex flex-col items-center justify-center px-6 py-3"
  >
    <div class="w-full flex h-full flex-col md:flex-row items-stretch gap-4">
      {#if inputType === "SLIDER"}
        <div class="w-full bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 flex flex-col items-center gap-6">
          <h3 class="text-2xl font-bold text-white tracking-wide">
            Make Your Choice
          </h3>
          
          <div class="w-full flex items-center justify-between text-yellow-300 font-extrabold text-xl">
            <span>{sliderMin} {sliderUnit}</span>
            <span class="text-4xl text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
              {sliderValue} {sliderUnit}
            </span>
            <span>{sliderMax} {sliderUnit}</span>
          </div>

          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            bind:value={sliderValue}
            disabled={disabled}
            class="w-full h-3 bg-white/15 rounded-lg appearance-none cursor-pointer accent-yellow-400 disabled:opacity-50"
          />

          <div class="w-full flex justify-between text-xs text-white/50 px-1">
            <span>{sliderLeftLabel}</span>
            <span>{sliderRightLabel}</span>
          </div>

          <button
            on:click={() => sendChoice(String(sliderValue))}
            disabled={disabled}
            class="mt-4 px-8 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:bg-white/10 text-amber-950 font-black rounded-full text-lg shadow-xl uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 disabled:pointer-events-none"
          >
            {submitLabel}
          </button>
        </div>
      {:else}
        {#each options as opt}
          <button
            role="button"
            class="choice-card flex-1 relative rounded-2xl cursor-pointer"
            style="background-color: {opt.color}1c; border: 4px solid {opt.color}66;"
            on:click={() => sendChoice(opt.id)}
            aria-pressed={choice === opt.id}
            aria-disabled={disabled}
            class:disabled
          >
            <div
              class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
            >
              <div
                class="absolute inset-0 opacity-25"
                style="background: radial-gradient(circle at center, {opt.color}, transparent 60%);"
              />
            </div>

            <div class="relative z-10 flex flex-col items-center text-center">
              <span class="flex flex-row justify-center items-center gap-6">
                {#if opt.emoji}
                  <div class="icon-bubble animate-wiggle text-yellow-400">
                    <span style="font-size: 2rem;">{opt.emoji}</span>
                  </div>
                {/if}
                <h2
                  class="text-xl md:text-2xl font-bold text-white drop-shadow-md"
                >
                  {opt.label}
                </h2>
              </span>
              {#if opt.subtext}
                <p class="mt-3 text-md md:text-lg text-white/90 leading-relaxed">
                  {opt.subtext}
                </p>
              {:else if opt.id === "share"}
                <p class="mt-3 text-md md:text-lg text-white/90 leading-relaxed">
                  Keep a few bananas and sell them for
                  <span
                    class="ml-2 px-2 py-1 rounded-md bg-yellow-300 text-black font-semibold text-lg"
                    >{$points}</span
                  >
                  doubloons
                </p>
              {:else if opt.id === "steal"}
                <p class="mt-3 text-md md:text-lg text-white/90 leading-relaxed">
                  Steal them all for
                  <span
                    class="ml-2 px-2 py-1 rounded-md bg-yellow-300 text-black font-semibold text-lg"
                    >2000</span
                  >
                  doubloons — but beware the consequences.
                </p>
              {/if}
            </div>

            {#if choice === opt.id}
              <div class="choice-badge">Selected</div>
            {/if}
          </button>
        {/each}
      {/if}
    </div>

    <!-- Warning and hint -->
    <div
      class="mt-6 w-full flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="warning-pill bg-yellow-800/60 text-yellow-200 px-4 py-2 rounded-full text-center font-semibold drop-shadow-md"
        >
          ⚠️ Warning
        </div>
        <p class="text-white/80 max-w-2xl">
          {$gameState?.page_data?.bottomWarningText || "If more than one monkey steals, everyone loses — mutually assured destruction."}
        </p>
      </div>
    </div>
  </main>
</div>

<style>
  :global(.font-dynapuff) {
    font-family:
      "DynaPuff",
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial;
  }

  .choice-card {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    min-height: 160px;
  }

  .choice-card .icon-bubble {
    width: 60px;
    height: 60px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.02)
    );
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
  }

  .choice-badge {
    position: absolute;
    top: 14px;
    right: 14px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 600;
    transform: translateY(-6px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
  }

  .warning-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  /* Animations */
  @keyframes wiggle {
    0% {
      transform: rotate(-6deg) scale(1);
    }
    50% {
      transform: rotate(6deg) scale(1.06);
    }
    100% {
      transform: rotate(-6deg) scale(1);
    }
  }

  .animate-wiggle {
    animation: wiggle 2.4s ease-in-out infinite;
  }

  /* disabled visual */
  .disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .choice-card {
      min-height: 120px;
    }
    .icon-bubble {
      width: 50px;
      height: 50px;
    }
  }
</style>
