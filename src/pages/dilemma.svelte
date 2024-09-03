<script lang="ts">
  import { sendMessage } from "$lib";
  function steal() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        choice: "steal",
      },
    });
  }
  function keep() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        choice: "keep",
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <h3>Psst: Don't tell anyone what you pick 🙊</h3>
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn variant-filled m-2 p-2"
    on:click={keep}>Keep a few 🦍</button
  >
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn variant-filled m-2 p-2"
    on:click={steal}>STEAL 🥷</button
  >
</div>
