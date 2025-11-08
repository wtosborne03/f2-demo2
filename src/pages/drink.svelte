<script lang="ts">
  import Drink from "$lib/components/drink.svelte";
  import { get } from "svelte/store";
  import { player_state } from "../stores/player_state";
  import type { DrinkingPrompt } from "../types/page_data";

  const m_data = $player_state.page_data as DrinkingPrompt;

  import { sendMessage } from "$lib/webSocketService";
  import type { PlayerState } from "../types/player_state";
  function confirm() {
    sendMessage({
      type: "game",
      data: {
        type: "confirm",
      },
    });
  }
</script>

<Drink prompt={m_data.prompt} />

{#if get(player_state).admin}
  <div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center"
  >
    <h3>Admin: Make sure that the players have completed their prompt.</h3>
    <button
      style="width: 100%; font-size: 1.5rem;"
      class="btn preset-filled m-2 p-2"
      on:click={confirm}>Confirm 👍</button
    >
  </div>
{/if}
