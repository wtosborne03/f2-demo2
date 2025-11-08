<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  function confirm() {
    sendMessage({
      type: "game",
      data: {
        type: "confirm",
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <h3>Admin: Make sure that the players have completed their prompt.</h3>
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn preset-filled m-2 p-2"
    on:click={confirm}>Confirm 👍</button
  >
</div>
