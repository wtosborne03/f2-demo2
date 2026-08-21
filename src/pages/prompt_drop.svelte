<script lang="ts">
  import { get } from "svelte/store";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";
  let isDropping = false;
  let submitted = false;

  function submit_prompt() {
    if (isDropping || submitted) return;
    isDropping = true;

    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
    });

    setTimeout(() => {
      submitted = true;
      isDropping = false;
    }, 600);
  }
</script>

<div
  class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center overflow-hidden"
>
  <div class="text-3xl font-black text-center mb-8 leading-snug">
    {m_data?.question}
  </div>

  {#if !submitted}
    <form
      class="flex flex-col items-center w-full {isDropping
        ? 'animate-drop'
        : ''}"
      onsubmit={(e) => {
        e.preventDefault();
        submit_prompt();
      }}
    >
      <label class="form-control w-full mb-6">
        <div class="label py-1">
          <span class="label-text font-bold text-sm text-base-content/85"
            >Your Idea</span
          >
        </div>
        <input
          type="text"
          class="input input-bordered input-lg w-full font-semibold"
          maxlength={50}
          bind:value={answer_text}
          placeholder="Type your ide here..."
          disabled={isDropping}
        />
      </label>
      <GameSubmit label="Drop Idea" onSubmit={submit_prompt} />
    </form>
  {:else}
    <div class="flex flex-col items-center justify-center py-8">
      <div class="text-xl font-bold opacity-80 mb-2">Submitted!</div>
      <div class="text-sm opacity-50">Waiting for other players...</div>
    </div>
  {/if}
</div>

<style>
  @keyframes dropAnim {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 1;
    }
    15% {
      transform: translateY(-10px) rotate(-1.5deg);
    }
    100% {
      transform: translateY(120vh) rotate(5deg);
      opacity: 0;
    }
  }

  .animate-drop {
    animation: dropAnim 0.6s cubic-bezier(0.55, 0, 1, 0.45) forwards;
    pointer-events: none;
  }
</style>
