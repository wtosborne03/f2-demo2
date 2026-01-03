<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { InstructionData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let p_data: InstructionData;
  p_data = get(gameState).page_data;
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div>Follow the instructions:</div>
  <div class="mb-2 p-4">{p_data.instruction}</div>
</div>
