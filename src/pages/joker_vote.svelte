<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let votedIndex: number | null = null;

  $: choices =
    $gameState.page_data?.choices || $gameState.page_data?.options || [];

  function handleVote(index: number) {
    votedIndex = index;

    gameClient.sendPlayerInput("task_vote", {
      choiceIndex: index,
      voteIndex: index,
      choice: index,
    });
  }
</script>

<div class="p-4 flex flex-col gap-4 max-w-md mx-auto w-full justify-center min-h-[70vh]">
  <div class="text-center">
    <h2 class="text-2xl font-bold">Vote for a Dare</h2>
  </div>

  <div class="flex flex-col gap-3">
    {#each choices as choice, idx}
      <button
        type="button"
        class="btn btn-block h-auto py-3 px-4 text-left justify-start font-medium text-base normal-case {votedIndex === idx ? 'btn-primary' : 'btn-outline'}"
        on:click={() => handleVote(idx)}
      >
        <span class="font-bold mr-2">{idx + 1}.</span>
        <span class="flex-1">{choice}</span>
        {#if votedIndex === idx}
          <span class="badge badge-sm badge-neutral ml-2">Voted</span>
        {/if}
      </button>
    {/each}
  </div>

  {#if votedIndex !== null}
    <div class="alert alert-info text-center justify-center">
      <span>Vote submitted! Waiting for results...</span>
    </div>
  {/if}
</div>
