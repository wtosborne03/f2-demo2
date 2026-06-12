<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { TextField, Button } from "m3-svelte";

  let m_data: any;
  m_data = get(gameState).page_data;

  let optionA = "";
  let optionB = "";

  function submit_prompt() {
    if (!optionA.trim() || !optionB.trim()) return;
    gameClient.sendPlayerInput("promptTextData", {
      optionA: optionA.trim(),
      optionB: optionB.trim(),
    });
  }
</script>

<div
  class="container overflow-y-auto h-full md:max-w-140 mx-auto w-full flex flex-col justify-start items-center p-4"
>
  <form
    class="flex h-full flex-col justify-center items-center w-full max-w-md"
    on:submit|preventDefault={submit_prompt}
  >
    <h2
      class="text-xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100"
    >
      Create Your Dilemma
    </h2>

    <div class="w-full flex flex-col gap-4 mb-6">
      <div>
        <div class="field-wrapper">
          <TextField
            label="Option A"
            type="text"
            maxlength={50}
            bind:value={optionA}
          />
        </div>
      </div>

      <div>
        <div class="field-wrapper">
          <TextField
            label="Option B"
            type="text"
            maxlength={50}
            bind:value={optionB}
          />
        </div>
      </div>
    </div>

    <Button
      variant="filled"
      disabled={!optionA.trim() || !optionB.trim()}
      onclick={submit_prompt}
      style="width: 100%;"
    >
      Submit Options
    </Button>
  </form>
</div>

<style>
  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }
</style>
