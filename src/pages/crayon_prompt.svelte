<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";
  import { TextFieldOutlined } from "m3-svelte";

  let answer_text = "";

  // Track which twists are selected
  let twistSweaty = false;
  let twistOffice = false;
  let twist3am = false;

  function submit_prompt() {
    // Start with the player's core prompt
    let finalPrompt = answer_text.trim();

    // Dynamically append the "Urgent Twists" strings
    if (twistSweaty) {
      finalPrompt += ", hyper-detailed sweat drops, moist, intense panic";
    }
    if (twistOffice) {
      finalPrompt +=
        ", in a sad corporate office cubicle under depressing fluorescent lights";
    }
    if (twist3am) {
      finalPrompt +=
        ", grainy night-vision trail-cam footage, timestamp in corner 03:00 AM";
    }

    gameClient.sendInput({
      type: "promptTextData",
      answer: finalPrompt,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4 py-8"
>
  <div class="header-icon text-5xl mb-4">🎨</div>

  <form
    class="flex flex-col justify-center items-center w-full max-w-md gap-6"
    on:submit|preventDefault={submit_prompt}
  >
    <!-- Core Prompt Input -->
    <div class="field-wrapper w-full">
      <TextFieldOutlined
        label="Image Prompt"
        type="text"
        maxlength={140}
        bind:value={answer_text}
      />
      <div class="text-right text-xs text-stone-400 mt-1">
        {answer_text.length} / 140
      </div>
    </div>

    <!-- Urgent Twists Section -->
    <div class="w-full flex flex-col gap-3 alignment-start">
      <div class="flex flex-col gap-2">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={twistSweaty}
            class="custom-checkbox"
          />
          <span>🥵 Make it sweaty</span>
        </label>

        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={twistOffice}
            class="custom-checkbox"
          />
          <span>💼 Mr. John Corporate</span>
        </label>

        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={twist3am}
            class="custom-checkbox"
          />
          <span>📹 3AM type Beat</span>
        </label>
      </div>
    </div>

    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font);
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--m3c-primary);
    text-transform: uppercase;
    letter-spacing: 0.1rem;
    margin-bottom: 0.25rem;
  }

  .instruction-text {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.333;
    font-weight: 600;
    text-align: center;
    color: var(--m3c-on-background);
    margin-bottom: 2rem;
  }

  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }

  /* Twist Checkbox Styles */
  .label-text {
    font-family: var(--m3-font);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--m3c-primary);
    text-transform: uppercase;
    letter-spacing: 0.05rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-family: var(--m3-font);
    color: var(--m3c-on-background);
    cursor: pointer;
    font-size: 1.5rem;
    padding: 0.25rem 0;
  }

  .custom-checkbox {
    width: 1.5rem;
    height: 1.5rem;
    accent-color: var(--m3c-primary);
    cursor: pointer;
  }
</style>
