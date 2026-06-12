<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import Spinner from "$lib/components/spinner.svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { TextFieldOutlined, Button } from "m3-svelte";
  import { onDestroy } from "svelte";

  let answer_text = "";
  let loading = false;
  let submitTimeoutId: any;

  async function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", { answer: answer_text });

    loading = true;
    answer_text = "";
    if (submitTimeoutId) clearTimeout(submitTimeoutId);
    submitTimeoutId = setTimeout(() => {
      loading = false;
    }, 3000);
  }

  onDestroy(() => {
    if (submitTimeoutId) clearTimeout(submitTimeoutId);
  });
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center px-4"
>
  <div class="subtitle-text">
    Think of some divisive debate topics. Submit as many as you want!
  </div>
  <form class="flex flex-col justify-center items-center w-full max-w-md" on:submit|preventDefault={submit_prompt}>
    <div class="field-wrapper">
      <TextFieldOutlined
        label="Debate Topic"
        type="text"
        maxlength={50}
        bind:value={answer_text}
      />
    </div>
    <div class="btn-wrapper">
      <Button
        variant="filled"
        onclick={submit_prompt}
        disabled={loading}
      >
        {#if loading}
          <Spinner />
        {:else}
          Submit
        {/if}
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
