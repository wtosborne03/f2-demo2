<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";

  let guess = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", { answer: guess });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full flex flex-col items-center">
    <div class="text-4xl text-center mb-2">🎭</div>
    <h3 class="text-2xl font-black mb-1 text-primary text-center">
      What Did You See?
    </h3>
    <p class="text-sm text-base-content/70 mb-6 text-center italic">
      Take your best guess at the performance!
    </p>
    
    <form class="flex flex-col items-center w-full" onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}>
      <label class="form-control w-full mb-6">
        <div class="label py-1">
          <span class="label-text font-bold text-sm text-base-content/85">Your Guess</span>
        </div>
        <input
          type="text"
          class="input input-bordered input-lg w-full font-semibold"
          maxlength={48}
          placeholder="Type your guess here..."
          bind:value={guess}
        />
      </label>

      <button
        type="submit"
        class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-2"
        disabled={!guess.trim()}
      >
        <span>🎯 Submit Guess</span>
      </button>
    </form>
  </div>
</div>
