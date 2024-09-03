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
  <h1 class="mb-2">Dilemma</h1>
  <dl class="list-dl">
    <div>
      <span class="badge bg-primary-500">🌈</span>
      <span class="flex-auto">
        <dt>Keep Low</dt>
        <dd>Keep a few bananas, and sell them at the market.</dd>
      </span>
    </div>
    <div>
      <span class="badge bg-primary-500">🥷</span>
      <span class="flex-auto">
        <dt>STEAL</dt>
        <dd>Steal and kill all other monkeys, recieving 2000 doubloons.</dd>
      </span>
    </div>
    <div>
      <span class="badge bg-primary-500">ℹ</span>
      <span class="flex-auto">
        <dt>STEAL</dt>
        <dd>
          More than one monkey STEALING will result in mutually assured
          destruction.
        </dd>
      </span>
    </div>
  </dl>
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn variant-filled m-2 p-2 text-xl"
    on:click={keep}>Keep a few 🌈</button
  >
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn variant-filled m-2 p-2 text-xl"
    on:click={steal}>STEAL 🥷</button
  >
</div>
