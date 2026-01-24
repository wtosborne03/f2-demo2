<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { CharadesData, CharadesResultsData } from "../types/page_data";
  import Icon from "@iconify/svelte";

  let m_data: CharadesResultsData;
  m_data = get(gameState).page_data;
</script>

<div
  class="h-full overflow-y-auto mx-auto w-full flex flex-col justify-center items-center p-3"
>
  <div
    class="bg-linear-to-br from-purple-900/20 to-pink-900/20 rounded-3xl flex flex-col justify-center gap-2 items-center p-4 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
  >
    <div
      class="bg-black/40 rounded-2xl w-full flex flex-col items-center gap-0 justify-center p-2 mb-2 border-2 border-purple-400/50"
    >
      <p class="text-[1.2rem] text-gray-300 opacity-80 mt-1">You Guessed</p>
      <div class="text-2xl font-semibold text-white mb-1 -mt-2">
        {m_data.guess}
      </div>
    </div>

    <div
      class="bg-blue-900/30 rounded-xl p-2 w-full mb-6 border-2 border-blue-500/50"
    >
      <p class="text-xl text-center italic text-blue-200">
        "{m_data.comment}"
      </p>
    </div>
    <div
      class="text-4xl text-center flex flex-row items-center justify-center w-full font-bold text-yellow-300 mb-3"
    >
      <Icon icon="mdi:star" class="mr-2" />
      {m_data.score}/10
      <Icon icon="mdi:star" class="ml-2" />
    </div>
  </div>
</div>
