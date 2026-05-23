<script lang="ts">
  import { onMount } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  let submitting = false;
  let canSubmit = false;
  let countdown = 0;

  onMount(() => {
    canSubmit = false;
    countdown = 5;
    const id = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        canSubmit = true;
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  });

  async function confirm() {
    if (submitting || !canSubmit) return;
    submitting = true;
    try {
      gameClient.sendPlayerInput("confirm");
    } finally {
      submitting = false;
    }
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center text-center px-4"
>
  <div class="max-w-xl bg-white/5 backdrop-blur-md rounded-lg p-8 shadow-md">
    <h2 class="text-2xl font-bold mb-2">Make your best case</h2>
    <p class="text-lg text-gray-100 mb-16">
      Give a strong argument for why other players should support your side. Be
      clear, concise, and persuasive — your words matter.
    </p>

    <div class="btn-wrapper">
      <Button
        variant="filled"
        onclick={confirm}
        disabled={submitting || !canSubmit}
      >
        {#if submitting}
          Sending...
        {:else}
          I'm Done {#if countdown > 0}({countdown}s){/if}
        {/if}
      </Button>
    </div>
  </div>
</div>

<style>
  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.5rem 0;
    font-size: 1.25rem;
  }
</style>
