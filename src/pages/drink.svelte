<script lang="ts">
  import Drink from "$lib/components/drink.svelte";
  import { get } from "svelte/store";
  import type { DrinkingPrompt } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  const m_data = $gameState.page_data as DrinkingPrompt;

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }
</script>

<Drink prompt={m_data.prompt} />

{#if get(gameState).admin}
  <div
    class="card p-6 mt-8 max-w-md mx-auto bg-surface-container border border-outline-variant shadow-2xl flex flex-col gap-4 items-center text-center rounded-2xl"
  >
    <div>
      <h3 class="h3 font-bold text-primary underline">Admin</h3>
      <p class="text-surface-100 mt-2 text-xl">
        Verify that all players have completed the drinking punishment.
      </p>
    </div>
    <div class="btn-wrapper">
      <Button variant="filled" onclick={confirm}>They drank 👍</Button>
    </div>
  </div>
{/if}

<style>
  .btn-wrapper {
    width: 100%;
  }
  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.25rem 0;
    font-size: 1.25rem;
    font-weight: bold;
    background-color: #2e7d32;
    color: white;
  }
</style>
