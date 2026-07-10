<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
  import AdminConfirm from "$lib/components/admin_confirm.svelte";
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <AdminConfirm
    message="Verify that all players have completed the prompt."
    buttonText="They drank 👍"
  />

  {#if !$gameState.admin}
    <div
      class="card p-6 mt-8 max-w-md mx-auto bg-surface-container border border-outline-variant shadow-2xl flex flex-col gap-4 items-center text-center rounded-2xl"
    >
      <div>
        <h3 class="h3 font-bold text-primary underline">Drinking...</h3>
        <p class="text-surface-100 mt-2 text-xl">
          Waiting for the admin to confirm that everyone has finished.
        </p>
      </div>
    </div>
  {/if}
</div>

