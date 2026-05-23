<script lang="ts">
  import { get } from "svelte/store";
  import type { ProductPromptData } from "../types/page_data";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { TextFieldOutlined, Button } from "m3-svelte";

  let m_data: ProductPromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("product", {
      part: "prompt",
      data: answer_text,
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div class="subtitle-text">Come up with a name for your product</div>
  <form class="flex flex-col justify-center items-center w-full max-w-md" on:submit|preventDefault={submit_prompt}>
    <div class="field-wrapper">
      <TextFieldOutlined
        label="Product Name"
        type="text"
        maxlength={20}
        bind:value={answer_text}
      />
    </div>
    <div class="btn-wrapper">
      <Button variant="filled" onclick={submit_prompt}>
        Submit
      </Button>
    </div>
  </form>
</div>

<style>
  .subtitle-text {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 400;
    text-align: center;
    color: var(--m3c-on-surface-variant);
    margin-bottom: 2rem;
  }

  .field-wrapper {
    width: 100%;
  }

  .field-wrapper > :global(*) {
    width: 100%;
  }

  .btn-wrapper {
    margin-top: 2rem;
    width: 100%;
  }

  .btn-wrapper > :global(*) {
    width: 100%;
  }
</style>
