<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { fly, scale, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { onMount } from "svelte";

  let m_data: any;
  m_data = get(gameState).page_data;
  // Ensure facts is an array, default to empty if undefined
  const facts: string[] = m_data?.facts || [];

  // State
  let currentIndex = 0;
  let true_facts: string[] = [];
  let submitted = false;
  let direction = 1; // 1 for right (true), -1 for left (false) for exit animation

  // Handle User Guess
  function handleGuess(isTrue: boolean) {
    if (submitted) return;

    direction = isTrue ? 1 : -1;

    // Store answer if true (assuming we send back the list of facts believed to be true)
    if (isTrue) {
      if (facts[currentIndex]) {
        true_facts.push(facts[currentIndex]);
      }
    }

    // Advance to next card after a brief delay to allow animation to start?
    // Actually svelte transitions work safely on reactive blocks.
    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= facts.length) {
        submit_prompt();
      }
    }, 200);
  }

  function submit_prompt() {
    submitted = true;
    gameClient.sendInput({
      type: "factGuesses",
      answer: true_facts,
    });
  }
</script>

<div
  class="w-full h-full inset-0 overflow-hidden flex flex-col items-center justify-between px-3 py-4 sm:p-6"
>
  <!-- Header / Progress -->
  <div
    class="w-full text-center text-slate-100 tracking-wider uppercase text-lg sm:text-xl font-black mt-1 sm:mt-2 relative z-10"
  >
    <span>{Math.min(currentIndex + 1, facts.length)} / {facts.length}</span>
  </div>

  <!-- Game Area -->
  <div
    class="grow min-h-0 flex items-center justify-center w-full max-w-xl relative"
  >
    {#if currentIndex < facts.length}
      {#key currentIndex}
        <div
          in:fly={{ y: 50, duration: 400, delay: 200, easing: cubicOut }}
          out:fly={{ x: direction * 300, y: 0, opacity: 0, duration: 300 }}
          class="absolute w-full aspect-4/5 max-h-[44vh] sm:max-h-[60vh] bg-white rounded-3xl shadow-xl border border-slate-200 p-5 sm:p-8 flex flex-col items-center justify-center text-center transform rotate-1"
        >
          <!-- Paper decoration/texture feel -->
          <div
            class="absolute top-0 inset-x-0 h-2 bg-linear-to-b from-slate-50 to-transparent rounded-t-3xl"
          ></div>

          <h3
            class="text-[2rem] sm:text-3xl md:text-4xl font-serif text-slate-800 leading-snug font-medium"
          >
            "{facts[currentIndex]}"
          </h3>

          <p
            class="mt-6 sm:mt-8 text-slate-400 font-sans text-xs sm:text-sm font-semibold tracking-widest uppercase"
          >
            True or False?
          </p>
        </div>
      {/key}
    {:else}
      <!-- Completion State -->
      <div
        in:scale={{ duration: 400, start: 0.9 }}
        class="flex flex-col items-center justify-center p-8 text-center"
      >
        <div
          class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10"
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
        <h2 class="text-2xl font-bold text-slate-800 mb-2">All Done!</h2>
        <p class="text-slate-500">Waiting for other players...</p>
      </div>
    {/if}
  </div>

  <!-- Controls -->
  {#if currentIndex < facts.length}
    <div
      class="w-full max-w-sm sm:max-w-md grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-8"
      transition:fade
    >
      <button
        on:click={() => handleGuess(false)}
        class="group active:scale-95 transition-all duration-150 flex flex-col items-center justify-center bg-rose-300 hover:bg-rose-400 py-4 sm:py-6 rounded-2xl shadow-sm border-b-4 border-rose-400 active:border-b-0 active:translate-y-1"
      >
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full text-rose-500 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 sm:h-8 sm:w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <span
          class="text-rose-900 font-bold text-base sm:text-lg uppercase tracking-wide"
          >False</span
        >
      </button>

      <button
        on:click={() => handleGuess(true)}
        class="group active:scale-95 transition-all duration-150 flex flex-col items-center justify-center bg-emerald-300 hover:bg-emerald-400 py-4 sm:py-6 rounded-2xl shadow-sm border-b-4 border-emerald-400 active:border-b-0 active:translate-y-1"
      >
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full text-emerald-500 flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 sm:h-8 sm:w-8"
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
        <span
          class="text-emerald-900 font-bold text-base sm:text-lg uppercase tracking-wide"
          >True</span
        >
      </button>
    </div>
  {:else}
    <!-- Spacer to keep layout checking out if needed, or empty -->
    <div class="h-32"></div>
  {/if}
</div>
