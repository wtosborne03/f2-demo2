<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { CharadesData, CharadesResultsData } from "../types/page_data";
  import { RatingGroup } from "@skeletonlabs/skeleton-svelte";
  import Icon from "@iconify/svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: CharadesResultsData;
  m_data = get(gameState).page_data;
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center p-6"
>
  <div
    class="bg-linear-to-br from-purple-900/20 to-pink-900/20 rounded-3xl flex flex-col justify-center items-center p-8 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
  >
    <div
      class="dark:bg-black/40 bg-white/40 li rounded-2xl w-full flex flex-col items-center justify-center p-6 mb-6 border-2 border-purple-400/50"
    >
      <p class="text-lg">Your Guess:</p>
      <div class="text-2xl font-semibold text-white">
        {m_data.guess}
      </div>
    </div>

    <div class="text-4xl text-center w-full font-bold text-yellow-300 mb-6">
      Score: {m_data.score}/10
    </div>
    <div class="bg-blue-900/30 rounded-xl p-6 border-2 border-blue-500/50">
      <p class="text-2xl text-center italic text-blue-200">
        "{m_data.comment}"
      </p>
    </div>
  </div>
</div>
