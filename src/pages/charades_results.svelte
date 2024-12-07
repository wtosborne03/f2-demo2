<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import type { CharadesData, CharadesResultsData } from "../types/page_data";
  import { Ratings } from "@skeletonlabs/skeleton";

  let m_data: CharadesResultsData;
  m_data = get<PlayerState>(player_state).page_data;
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4 text-2xl text-center">
    Your Guess: {m_data.guess}
  </div>
  <Ratings value={m_data.score} max={10}>
    <svelte:fragment slot="empty"
      ><i class="fa-regular fa-circle text-yellow-500"></i></svelte:fragment
    >
    <svelte:fragment slot="half">(icon)</svelte:fragment>
    <svelte:fragment slot="full"
      ><i class="fas fa-circle text-yellow-500"></i></svelte:fragment
    >
  </Ratings>
  <div class="text-3xl text-center w-full font-bold text-yellow-500">
    Score: {m_data.score}/10
  </div>
  <div class="mb-2 p-4 text-2xl text-center">
    "{m_data.comment}"
  </div>
</div>
