<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: any;
  m_data = get(gameState).page_data;

  function submit_vote(index: number) {
    gameClient.sendPlayerInput("multiple_choice", {
      answer_index: index,
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <h2 class="text-3xl font-black mb-8">
    Would You Rather...
  </h2>
  
  <div class="w-full flex flex-col gap-4">
    <button
      type="button"
      class="btn btn-outline btn-primary btn-lg w-full py-5 h-auto text-lg font-black leading-snug"
      onclick={() => submit_vote(0)}
    >
      {m_data?.answers?.[0] || "Option A"}
    </button>

    <div class="text-center font-black text-base-content/40 py-2">OR</div>

    <button
      type="button"
      class="btn btn-outline btn-secondary btn-lg w-full py-5 h-auto text-lg font-black leading-snug"
      onclick={() => submit_vote(1)}
    >
      {m_data?.answers?.[1] || "Option B"}
    </button>
  </div>
</div>
