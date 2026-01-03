<script lang="ts">
  import Drink from "$lib/components/drink.svelte";
  import { get } from "svelte/store";
  import type { DrinkingPrompt } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  const m_data = $gameState.page_data as DrinkingPrompt;

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }
</script>

<Drink prompt={m_data.prompt} />

{#if get(gameState).admin}
  <div class="flex mt-10 flex-col justify-center items-center text-center">
    <h3>Admin: Make sure that the players have completed their prompt.</h3>
    <button
      style=" font-size: 1.25rem;"
      class="btn preset-filled m-4 p-3"
      on:click={confirm}>They drank 👍</button
    >
  </div>
{/if}
