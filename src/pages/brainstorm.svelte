<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { onDestroy } from "svelte";

  let answer_text = "";
  let loading = false;
  let submitTimeoutId: any;

  async function submit_prompt() {
    if (!answer_text.trim()) return;
    gameClient.sendPlayerInput("promptTextData", { answer: answer_text });

    loading = true;
    answer_text = "";
    if (submitTimeoutId) clearTimeout(submitTimeoutId);
    submitTimeoutId = setTimeout(() => {
      loading = false;
    }, 3000);
  }

  onDestroy(() => {
    if (submitTimeoutId) clearTimeout(submitTimeoutId);
  });
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center space-y-6">
  <div class="text-base text-base-content/80 leading-relaxed max-w-xs mx-auto">
    Think of some divisive debate topics. Submit as many as you want!
  </div>
  
  <form class="flex flex-col items-center w-full" onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}>
    <label class="form-control w-full mb-6">
      <div class="label py-1">
        <span class="label-text font-bold text-sm text-base-content/85">Debate Topic</span>
      </div>
      <input
        type="text"
        class="input input-bordered input-lg w-full font-semibold"
        maxlength={50}
        bind:value={answer_text}
        placeholder="Type a topic..."
      />
    </label>

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      disabled={loading || !answer_text.trim()}
    >
      {#if loading}
        <span class="loading loading-spinner"></span>
        Submitting...
      {:else}
        Submit
      {/if}
    </button>
  </form>
</div>
