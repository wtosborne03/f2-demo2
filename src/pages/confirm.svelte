<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
  import AdminConfirm from "$lib/components/admin_confirm.svelte";
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 space-y-6">
  <AdminConfirm
    message="Verify that all players have completed the prompt."
    buttonText="They drank 👍"
  />

  {#if !$gameState.admin}
    <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full text-center">
      <h3 class="text-2xl font-black text-primary mb-3">Drinking...</h3>
      <p class="text-base text-base-content/80 leading-relaxed">
        Waiting for the admin to confirm that everyone has finished.
      </p>
    </div>
  {/if}
</div>
