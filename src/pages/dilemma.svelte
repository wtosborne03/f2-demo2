<script lang="ts">
  import { sendMessage } from "$lib";
  import goodMonkey from "$lib/assets/icons/goodMonkey.jpeg";
  import badMonkey from "$lib/assets/icons/evilMonkey.jpeg";
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
      <span class="badge bg-primary-500">🦍</span>
      <span class="flex-auto">
        <dt>Share</dt>
        <dd>
          Keep a few bananas, and sell them at the market for 1000 doubloons.
        </dd>
      </span>
    </div>
    <div>
      <span class="badge bg-primary-500">🥷</span>
      <span class="flex-auto">
        <dt>Steal</dt>
        <dd>Steal and kill all other monkeys, recieving 1500 doubloons.</dd>
      </span>
    </div>
    <div>
      <span class="badge bg-primary-500">ℹ</span>
      <span class="flex-auto">
        <dt>Be Warned!</dt>
        <dd>
          More than one monkey STEALING will result in mutually assured
          destruction.
        </dd>
      </span>
    </div>
  </dl>
  <div
    class="flex flex-row justify-center gap-4 mt-6 text-center text-xl font-bold underline"
  >
    <div class="w-1/2 text-green-200">
      Share
      <img
        class="rounded-xl hover:brightness-90 hover:cursor-pointer"
        src={goodMonkey}
        alt="monkey"
        on:click={keep}
      />
    </div>
    <div class="w-1/2 text-red-200">
      Steal
      <img
        class="rounded-xl hover:brightness-90 hover:cursor-pointer"
        src={badMonkey}
        alt="monkey"
        on:click={steal}
      />
    </div>
  </div>
</div>
