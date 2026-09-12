<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  interface TopicData {
    picker?: string;
    suggestions?: string[];
    message?: string;
  }

  $: pData = ($gameState?.page_data || {}) as TopicData;
  $: isPicker = !pData?.picker || pData.picker === $gameState?.name;

  let topicInput = "";
  let isSubmitted = false;

  $: suggestions = [
    "College Football",
    "Cocktail Culture",
    "Henry Ford",
    "Charlie Kirk Facts",
    "Zambonis",
  ];

  function submitTopic(topicToSubmit: string) {
    if (!topicToSubmit.trim() || isSubmitted) return;
    isSubmitted = true;
    topicInput = topicToSubmit.trim();
    gameClient.sendInput({
      type: "trivia_tap_topic",
      topic: topicInput,
    });
  }
</script>

<div
  class="flex flex-col justify-center items-center min-h-full w-full max-w-md mx-auto px-4 py-4 text-center select-none"
>
  {#if isPicker}
    {#if !isSubmitted}
      <!-- Topic Picker Card -->
      <div
        class="w-full bg-base-200/90 text-base-content border border-base-content/15 rounded-2xl p-5 shadow-xl text-left"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">🍺</span>
          <h1 class="text-xl font-black uppercase tracking-tight">
            PICK TONIGHT'S TOPIC
          </h1>
        </div>

        <!-- Topic Input Form -->
        <form
          on:submit|preventDefault={() => submitTopic(topicInput)}
          class="flex flex-col gap-3 mb-4"
        >
          <input
            id="topic-input"
            type="text"
            maxlength="40"
            bind:value={topicInput}
            placeholder="Type any topic (e.g. 90s Sitcoms)..."
            class="input input-bordered w-full font-bold text-base bg-base-100 focus:input-primary"
          />

          <button
            type="submit"
            disabled={!topicInput.trim()}
            class="btn btn-primary btn-md w-full font-black text-sm uppercase tracking-wider disabled:opacity-40"
          >
            LOCK IN TOPIC ➔
          </button>
        </form>

        <!-- House Suggestions -->
        <div
          class="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2"
        >
          OR TAP A SUGGESTION:
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each suggestions as s}
            <button
              type="button"
              on:click={() => submitTopic(s)}
              class="btn btn-xs btn-outline bg-base-100 hover:bg-base-300 font-semibold"
            >
              {s}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Topic Submitted Card -->
      <div
        class="w-full bg-base-200/90 text-base-content border border-amber-500/40 p-6 shadow-xl rounded-2xl text-center"
      >
        <div class="text-4xl mb-2">🍻</div>
        <div
          class="text-xs uppercase font-black tracking-widest text-amber-500"
        >
          TOPIC LOCKED IN!
        </div>
        <h2 class="text-2xl font-black uppercase mt-2 mb-2">
          "{topicInput}"
        </h2>
        <p class="text-xs text-base-content/70 font-semibold">
          Barkeep is chalking up the questions on the TV!
        </p>
      </div>
    {/if}
  {:else}
    <!-- Waiting Card for Other Players -->
    <div
      class="w-full bg-base-200/90 text-base-content border border-base-content/15 p-6 shadow-xl rounded-2xl text-center"
    >
      <div class="text-4xl mb-3 animate-bounce">🍺</div>
      <h2 class="text-lg font-black uppercase mb-1">POURING THE DRAFT...</h2>
      <p class="text-xs font-semibold text-base-content/70 leading-relaxed">
        {pData.message ||
          `Waiting for ${pData.picker || "the bar"} to pick tonight's topic...`}
      </p>
    </div>
  {/if}
</div>
