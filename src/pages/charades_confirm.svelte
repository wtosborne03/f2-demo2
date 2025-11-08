<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import type { CharadesData } from "../types/page_data";
  function confirm() {
    sendMessage({
      type: "game",
      data: {
        type: "continue",
      },
    });
  }

  let m_data: CharadesData;
  m_data = get<PlayerState>(player_state).page_data;
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <h3 class="mt-16 mb-2 pl-2 text-2xl">Acting Prompt:</h3>
  <div class="mb-2 p-4 text-2xl font-bold text-center">{m_data.prompt}</div>
  <div class="mb-2 p-4 text-xl font-bold text-gray-400 text-center">
    (Do NOT reveal your prompt or say any part of it out loud! 🥺 Pretty
    Please?)
  </div>
  <button
    style="width: 100%; font-size: 1.5rem;"
    class="btn preset-filled m-2 p-2"
    on:click={confirm}>Ready to Act 🤹‍♂️</button
  >
</div>
