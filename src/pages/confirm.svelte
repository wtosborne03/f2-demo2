<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div
    class="card p-6 mt-8 max-w-md mx-auto bg-surface-800/80 backdrop-blur-md border border-surface-700 shadow-2xl flex flex-col gap-4 items-center text-center rounded-2xl"
  >
    <div>
      <h3 class="h3 font-bold text-primary-200 underline">Admin</h3>
      <p class="text-surface-100 mt-2 text-xl">
        Verify that all players have completed the prompt.
      </p>
    </div>
    <button
      type="button"
      class="btn bg-green-600 border-green-500 border-4 text-white w-full font-bold text-xl py-3 shadow-lg"
      on:click={confirm}>They drank 👍</button
    >
  </div>
</div>
