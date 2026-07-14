<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: any;
  m_data = get(gameState).page_data;

  let optionA = "";
  let optionB = "";

  function submit_prompt() {
    if (!optionA.trim() || !optionB.trim()) return;
    gameClient.sendPlayerInput("promptTextData", {
      optionA: optionA.trim(),
      optionB: optionB.trim(),
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <form
    class="flex flex-col items-center w-full"
    onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}
  >
    <h2 class="text-3xl font-black mb-6">
      Create Your Dilemma
    </h2>

    <div class="w-full flex flex-col gap-4 mb-8">
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text font-bold text-sm text-base-content/85">Option A</span>
        </div>
        <input
          type="text"
          class="input input-bordered input-lg w-full font-semibold"
          maxlength={50}
          placeholder="Would you rather..."
          bind:value={optionA}
        />
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text font-bold text-sm text-base-content/85">Option B</span>
        </div>
        <input
          type="text"
          class="input input-bordered input-lg w-full font-semibold"
          maxlength={50}
          placeholder="Or would you rather..."
          bind:value={optionB}
        />
      </label>
    </div>

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      disabled={!optionA.trim() || !optionB.trim()}
    >
      Submit Options
    </button>
  </form>
</div>
