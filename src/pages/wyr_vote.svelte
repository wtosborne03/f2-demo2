<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  let m_data: any;
  m_data = get(gameState).page_data;

  function submit_vote(index: number) {
    gameClient.sendPlayerInput("multiple_choice", {
      answer_index: index,
    });
  }
</script>

<div
  class="container h-full max-w-md mx-auto w-full flex flex-col justify-center items-center p-4"
>
  <h2 class="text-xl font-bold mb-8 text-center text-slate-800 dark:text-slate-100">
    Would You Rather...
  </h2>
  
  <div class="w-full flex flex-col gap-4">
    <Button
      size="l"
      square
      style="width: 100%; min-height: 4.5rem;"
      onclick={() => submit_vote(0)}
    >
      {m_data?.answers?.[0] || "Option A"}
    </Button>

    <div class="text-center font-bold text-slate-400 dark:text-slate-500 py-1">OR</div>

    <Button
      size="l"
      square
      style="width: 100%; min-height: 4.5rem;"
      onclick={() => submit_vote(1)}
    >
      {m_data?.answers?.[1] || "Option B"}
    </Button>
  </div>
</div>
