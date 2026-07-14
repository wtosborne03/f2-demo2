<script lang="ts">
  import { get } from "svelte/store";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center">
  <div class="text-sm font-bold opacity-70 mb-2">Fill in the Blank</div>
  <div class="text-3xl font-black text-center mb-8 leading-snug">{m_data.question}</div>
  
  <form class="flex flex-col items-center w-full" onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}>
    <label class="form-control w-full mb-6">
      <div class="label py-1">
        <span class="label-text font-bold text-sm text-base-content/85">Your Answer</span>
      </div>
      <input
        type="text"
        class="input input-bordered input-lg w-full font-semibold"
        maxlength={50}
        bind:value={answer_text}
        placeholder="Type your answer here..."
      />
    </label>
    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
