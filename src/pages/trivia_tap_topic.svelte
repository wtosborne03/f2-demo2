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

  $: suggestions = pData?.suggestions || [
    "90s Cartoon Villains",
    "Dive Bar Cocktails",
    "Trash TV & Reality Drama",
    "Florida Man Headlines",
    "Questionable Life Choices",
    "Forgotten 2000s Pop Hits",
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
  class="min-h-full w-full flex flex-col justify-center items-center p-4 bg-[#0c0a09] text-[#e7e5e4] font-mono select-none"
>
  {#if isPicker}
    {#if !isSubmitted}
      <!-- Receipt Tab Styling -->
      <div
        class="w-full max-w-sm bg-[#fbfbf9] text-[#1c1917] border-2 border-dashed border-[#78716c] border-t-8 border-t-[#451a03] p-5 shadow-2xl rounded-sm -rotate-1"
      >
        <div class="text-xs uppercase tracking-widest text-[#78350f] font-black mb-1">
          🍺 TAVERN BAR TAB
        </div>
        <h1 class="text-2xl font-black uppercase tracking-tight mb-3">
          PICK THE TOPIC
        </h1>

        <!-- Custom Input Form -->
        <form
          on:submit|preventDefault={() => submitTopic(topicInput)}
          class="flex flex-col gap-3 mb-4"
        >
          <label for="topic-input" class="text-xs font-bold text-stone-700">
            ENTER ANY TOPIC:
          </label>
          <input
            id="topic-input"
            type="text"
            maxlength="40"
            bind:value={topicInput}
            placeholder="e.g. 90s Sitcoms..."
            class="w-full px-3 py-2.5 bg-[#fef3c7] border-2 border-[#1c1917] rounded font-bold text-base text-[#1c1917] placeholder:text-stone-400 focus:outline-none focus:bg-[#fde047]"
          />

          <button
            type="submit"
            disabled={!topicInput.trim()}
            class="w-full py-3 bg-[#1c1917] text-[#fef3c7] font-black text-sm uppercase tracking-wider rounded border border-[#78350f] shadow active:translate-y-0.5 disabled:opacity-40"
          >
            LOCK IN TOPIC ➔
          </button>
        </form>

        <!-- Quick Tavern Suggestions -->
        <div class="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
          OR TAP A HOUSE SUGGESTION:
        </div>
        <div class="flex flex-wrap gap-1.5">
          {#each suggestions as s}
            <button
              type="button"
              on:click={() => submitTopic(s)}
              class="px-2.5 py-1 text-xs bg-[#e7e5e4] hover:bg-[#d6c7a1] text-[#1c1917] font-bold rounded border border-stone-400 active:scale-95 transition-transform"
            >
              {s}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Stamped Coaster Confirmation -->
      <div
        class="w-full max-w-sm bg-[#d6c7a1] text-[#1c1917] border-4 border-[#5c4426] p-6 shadow-2xl rounded-xl rotate-1 text-center"
      >
        <div class="text-4xl mb-2">🍻</div>
        <div class="text-xs uppercase font-black tracking-widest text-[#78350f]">
          TOPIC LOCKED IN!
        </div>
        <h2 class="text-2xl font-black uppercase mt-1 mb-2">
          "{topicInput}"
        </h2>
        <div class="text-xs text-stone-700 font-bold">
          Barkeep is chalking up the questions. Look at the TV!
        </div>
      </div>
    {/if}
  {:else}
    <!-- Other Players Waiting Coaster -->
    <div
      class="w-full max-w-sm bg-[#d6c7a1] text-[#1c1917] border-4 border-[#5c4426] p-6 shadow-2xl rounded-xl -rotate-1 text-center"
    >
      <div class="text-4xl mb-2 animate-bounce">🍺</div>
      <h2 class="text-xl font-black uppercase mb-1">
        POURING THE DRAFT...
      </h2>
      <p class="text-xs font-bold text-stone-700 leading-relaxed">
        {pData.message || `Waiting for ${pData.picker || "the bar"} to pick tonight's poison topic...`}
      </p>
    </div>
  {/if}
</div>
