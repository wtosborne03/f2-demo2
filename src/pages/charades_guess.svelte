<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { TextFieldOutlined, Button } from "m3-svelte";

  let guess = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", { answer: guess });
  }
</script>

<div
  class="container h-full overflow-y-auto mx-auto w-full flex flex-col justify-center items-center p-2"
>
  <div
    class="bg-linear-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-6 max-w-xl w-full border-4 border-purple-500/30 shadow-2xl flex flex-col items-center"
  >
    <div class="text-3xl text-center mb-2">🎭</div>
    <h3 class="text-xl font-bold mb-1 text-purple-300 text-center">
      What Did You See?
    </h3>
    <p class="text-md text-gray-300 mb-6 text-center italic">
      Take your best guess at the performance!
    </p>
    <form class="flex flex-col justify-center items-center w-full" on:submit|preventDefault={submit_prompt}>
      <div class="field-wrapper">
        <TextFieldOutlined
          label="Your Guess"
          type="text"
          maxlength={48}
          placeholder="Type your guess here..."
          bind:value={guess}
        />
      </div>
      <div class="btn-wrapper">
        <Button
          variant="filled"
          onclick={submit_prompt}
        >
          🎯 Submit Guess
        </Button>
      </div>
    </form>
  </div>
</div>

<style>
  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }

  .btn-wrapper {
    margin-top: 1.5rem;
    width: 100%;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
  }
</style>
