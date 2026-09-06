<script lang="ts">
  import { onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let votedValue: boolean | null = null;
  let isTalkingToEarpiece = false;
  let micError = "";

  function handleVote(satisfied: boolean) {
    votedValue = satisfied;
    gameClient.sendPlayerInput("satisfaction_vote", { satisfied });
  }

  async function handleToggleTalking() {
    if (isTalkingToEarpiece) {
      gameClient.stopAudioStream();
      isTalkingToEarpiece = false;
    } else {
      micError = "";
      const success = await gameClient.startAudioStream();
      if (success) {
        isTalkingToEarpiece = true;
      } else {
        micError = "Could not access microphone. Check permissions.";
      }
    }
  }

  onDestroy(() => {
    if (isTalkingToEarpiece) {
      gameClient.stopAudioStream();
    }
  });
</script>

<div class="p-4 flex flex-col gap-6 max-w-md mx-auto w-full justify-center min-h-[70vh]">
  <div class="text-center">
    <h2 class="text-2xl font-bold">
      {$gameState.page_data?.jokerName || "Joker"}'s Challenge
    </h2>
    {#if $gameState.page_data?.challengeDescription}
      <p class="text-base text-base-content/80 mt-1 font-medium">
        "{$gameState.page_data.challengeDescription}"
      </p>
    {/if}
  </div>

  <!-- Earpiece Microphone Control -->
  <div class="flex flex-col gap-2">
    <button
      type="button"
      class="btn btn-block text-base {isTalkingToEarpiece ? 'btn-error animate-pulse' : 'btn-neutral'}"
      on:click={handleToggleTalking}
    >
      {isTalkingToEarpiece ? "Broadcasting (Tap to Mute)" : "Talk into Earpiece"}
    </button>
    {#if micError}
      <div class="alert alert-error text-sm">
        <span>{micError}</span>
      </div>
    {/if}
  </div>

  <!-- Pass / Fail Voting -->
  <div class="flex flex-col gap-3">
    <div class="text-xs font-bold text-center uppercase tracking-wider opacity-60">
      Judge Performance
    </div>
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="btn btn-success btn-lg {votedValue === true ? '' : 'btn-outline'}"
        on:click={() => handleVote(true)}
      >
        Pass
      </button>
      <button
        type="button"
        class="btn btn-error btn-lg {votedValue === false ? '' : 'btn-outline'}"
        on:click={() => handleVote(false)}
      >
        Fail
      </button>
    </div>
    {#if votedValue !== null}
      <div class="text-center text-sm opacity-80">
        You voted: <strong class="uppercase">{votedValue ? "Pass" : "Fail"}</strong>
      </div>
    {/if}
  </div>
</div>
