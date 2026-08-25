<script lang="ts">
  import { get } from "svelte/store";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";
  let isSubmitted = false;
  let inputEl: HTMLInputElement;

  function submit_prompt() {
    if (!answer_text.trim() || isSubmitted) return;
    isSubmitted = true;
    gameClient.sendInput({
      type: "promptTextData",
      answer: answer_text.trim(),
    });
  }
</script>

<div class="flex flex-col justify-center items-center min-h-full w-full max-w-lg mx-auto px-4 py-6 text-center select-none animate-in fade-in zoom-in-95 duration-200">
  <!-- Top Retro Badge -->
  <div class="inline-flex items-center gap-2 px-4 py-1 mb-4 bg-black text-[#ffe600] font-black text-xs uppercase tracking-widest border-2 border-black shadow-[3px_3px_0px_#000000] -rotate-1 rounded-sm">
    <span>💀</span>
    <span>QUESTION 1 • FILL THE BLANK</span>
  </div>

  <!-- Prompt Container Card -->
  <div class="w-full bg-[#a3e635] border-4 border-black shadow-[6px_6px_0px_#000000] rounded-xl p-5 mb-6 text-center">
    <div class="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight leading-snug break-words">
      {m_data.question}
    </div>
  </div>
  
  {#if !isSubmitted}
    <!-- Input Form Card -->
    <form class="flex flex-col items-center w-full bg-white border-4 border-black shadow-[6px_6px_0px_#000000] rounded-xl p-5" onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}>
      <div class="w-full mb-4 text-left">
        <label for="blank-input" class="block font-black text-xs uppercase tracking-wider text-black mb-1.5">
          YOUR ANSWER (MAX 50 CHARS):
        </label>
        <input
          id="blank-input"
          bind:this={inputEl}
          type="text"
          class="w-full px-4 py-3.5 bg-[#ffe600] border-4 border-black rounded-lg font-black text-xl text-black uppercase tracking-tight shadow-[3px_3px_0px_#000000] focus:outline-none focus:bg-[#00f0ff] focus:shadow-[5px_5px_0px_#000000] transition-all placeholder:text-black/40"
          maxlength={50}
          bind:value={answer_text}
          placeholder="TYPE HERE..."
          autofocus
        />
      </div>

      <button
        type="submit"
        disabled={!answer_text.trim()}
        class="w-full py-4 px-6 bg-black text-[#00ff66] font-black text-xl uppercase tracking-wider border-4 border-black shadow-[6px_6px_0px_#00ff66] rounded-xl transition-all active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#00ff66] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-black/90"
      >
        SUBMIT ANSWER ➔
      </button>
    </form>
  {:else}
    <!-- Stamped Locked-In Badge -->
    <div class="w-full flex flex-col items-center justify-center p-8 bg-[#00ff66] border-4 border-black shadow-[8px_8px_0px_#000000] rounded-xl -rotate-1 animate-in zoom-in-75 duration-300">
      <div class="text-5xl mb-2">⚡</div>
      <div class="font-black text-3xl text-black uppercase tracking-tighter mb-1">
        LOCKED IN!
      </div>
      <div class="font-mono font-bold text-sm text-black/80 uppercase">
        "{answer_text}"
      </div>
      <div class="mt-4 px-4 py-1.5 bg-black text-[#ffe600] font-black text-xs uppercase tracking-widest rounded border-2 border-black">
        WATCH TV FOR THE REVEAL
      </div>
    </div>
  {/if}
</div>
