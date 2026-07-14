<script lang="ts">
  import { onMount } from "svelte";
  import { gameClient } from "$lib/wsapi/gameClient";

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

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center space-y-6">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full">
    <h2 class="text-2xl font-black mb-3">Make your best case</h2>
    <p class="text-base text-base-content/80 mb-8 leading-relaxed">
      Give a strong argument for why other players should support your side. Be
      clear, concise, and persuasive — your words matter.
    </p>

    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      onclick={confirm}
      disabled={submitting || !canSubmit}
    >
      {#if submitting}
        <span class="loading loading-spinner"></span>
        Sending...
      {:else}
        I'm Done {#if countdown > 0}({countdown}s){/if}
      {/if}
    </button>
  </div>
</div>
