<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let pageData: any;
  $: pageData = $gameState.page_data || {};

  let answerText = "";

  function submitGuess() {
    if (!answerText.trim()) return;
    gameClient.sendInput({
      type: "promptTextData",
      answer: answerText.trim(),
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center">
  <div class="text-sm font-bold opacity-70 mb-1">Celebrity Guessing</div>
  <div class="text-2xl font-black text-center mb-6 leading-snug">{pageData.question || "Guess the Celebrity!"}</div>

  <form class="flex flex-col items-center w-full" onsubmit={(e) => { e.preventDefault(); submitGuess(); }}>
    <label class="form-control w-full mb-6">
      <div class="label py-1">
        <span class="label-text font-bold text-sm text-base-content/85">Celebrity Name</span>
      </div>
      <input
        type="text"
        class="input input-bordered input-lg w-full font-semibold"
        maxlength={40}
        bind:value={answerText}
        placeholder="Type celebrity name..."
      />
    </label>

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
    >
      Submit Guess 🚀
    </button>
  </form>
</div>
