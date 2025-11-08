<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { BombData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  import { DotLottieSvelte } from "@lottiefiles/dotlottie-svelte";

  let has_bomb = false;

  player_state.subscribe((value: PlayerState) => {
    has_bomb = value.page_data.has_bomb;
  });
  let sending_player = "";

  async function send_bomb() {
    sendMessage({
      type: "game",
      data: {
        type: "send",
        player: sending_player,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  {#if has_bomb}
    <div class="">
      <DotLottieSvelte src="bomb.json" loop autoplay />
    </div>
    <div class="text-lg">Type in a player's name to send the bomb to them</div>
    <form class="flex flex-col justify-center items-center w-full">
      <input
        class="input w-full"
        type="text"
        maxlength="16"
        bind:value={sending_player}
        on:submit={send_bomb}
      />
      <button class="btn preset-filled mt-12" on:click={send_bomb}>Send</button
      >
    </form>
  {/if}
</div>
