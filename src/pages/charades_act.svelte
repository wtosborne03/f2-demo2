<script lang="ts">
  import { sendMessage } from "$lib";
  function confirm() {
    sendMessage({
      type: "game",
      data: {
        type: "done",
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center text-center"
>
  <h3 class="text-2xl mb-6">Act out your prompt</h3>
  <button
    style="font-size: 1.5rem;"
    class="btn variant-filled-error m-2 p-4"
    on:click={confirm}>I'm Done</button
  >
</div>
