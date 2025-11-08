<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";

  let guess = "";

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "guess",
        answer: guess,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="text-lg text-center">What do you think you just saw?</div>
  <form class="flex flex-col justify-center items-center w-full">
    <div class="flex flex-row justify-start items-center w-full">
      <input
        type="text"
        class="textarea mt-10 w-full"
        maxlength="30"
        placeholder="guess"
        bind:value={guess}
      />
    </div>
    <button class="btn preset-filled mt-12" on:click={submit_prompt}
      >Guess</button
    >
  </form>
</div>
