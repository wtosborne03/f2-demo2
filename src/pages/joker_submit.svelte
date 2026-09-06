<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let dareText = "";
  let submitted = false;

  function handleSubmit() {
    if (!dareText.trim()) return;
    submitted = true;

    gameClient.sendPlayerInput("task_submission", {
      text: dareText.trim(),
      submission: dareText.trim(),
      task: dareText.trim(),
      value: dareText.trim(),
    });
  }
</script>

<div class="p-4 flex flex-col gap-4 max-w-md mx-auto w-full justify-center min-h-[70vh]">
  {#if !submitted}
    <div class="text-center">
      <h2 class="text-2xl font-bold">Submit a Dare</h2>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-4">
      <textarea
        class="textarea textarea-bordered w-full text-base"
        rows="4"
        bind:value={dareText}
        placeholder={$gameState.page_data?.placeholder || "Type your dare here..."}
        maxlength={120}
        required
      ></textarea>

      <button
        type="submit"
        class="btn btn-primary btn-block text-base font-bold"
        disabled={!dareText.trim()}
      >
        Submit Dare
      </button>
    </form>
  {:else}
    <div class="alert alert-success text-center justify-center">
      <span>Dare submitted! Waiting for next phase...</span>
    </div>
  {/if}
</div>
