<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  // Use 'any' or define interface locally if types aren't strictly exported or if I want to be safe.
  // prompt.svelte uses PromptData.
  let m_data: any;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center p-4"
>
  <!-- Sticky Note Effect -->
  <div
    class="relative bg-[#f5f2df] border-4 border-black rounded-4xl rounded-bl-none rounded-tr-none w-full max-w-sm aspect-square p-4 shadow-[5px_5px_15px_rgba(0,0,0,0.2)] transform -rotate-1 flex flex-col"
  >
    <!-- Prompt Text -->
    <div
      class="text-2xl text-center font-serif text-slate-800 mb-3 leading-7 font-bold"
    >
      {m_data?.topic}
    </div>

    <!-- Writing Area -->
    <form
      class="grow flex flex-col w-full h-full"
      on:submit|preventDefault={submit_prompt}
    >
      <textarea
        class="w-full h-full bg-transparent border-0 resize-none outline-none text-xl sm:text-3xl font-serif text-slate-800 placeholder-slate-400 text-center flex items-center justify-center leading-normal"
        placeholder={`Write a fake fact about ${m_data?.topic}...`}
        bind:value={answer_text}
        maxlength="48"
        style="font-family: 'Caveat', 'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive;"
      ></textarea>
    </form>
  </div>

  <!-- Submit Button (Outside to not clutter the note, or could be a 'doodle' on the note) -->
  <div class="mt-8 transform rotate-1">
    <GameSubmit onSubmit={submit_prompt} />
  </div>
</div>
