<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
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
  <h3>Give a good argument as to why players should support your side</h3>
  <button
    style="font-size: 1.5rem;"
    class="btn preset-filled-error-500 m-2 p-4"
    on:click={confirm}>I'm Done</button
  >
</div>
