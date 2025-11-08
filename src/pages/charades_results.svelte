<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import type { CharadesData, CharadesResultsData } from "../types/page_data";
  import { RatingGroup } from "@skeletonlabs/skeleton-svelte";

  let m_data: CharadesResultsData;
  m_data = get<PlayerState>(player_state).page_data;
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <div class="mb-2 p-4 text-2xl text-center">
    Your Guess: {m_data.guess}
  </div>
  <RatingGroup value={m_data.score} count={10}>
    <RatingGroup.Control>
      <RatingGroup.Context>
        {#snippet children(ratingGroup)}
          {#each ratingGroup().items as index (index)}
            <RatingGroup.Item {index} />
          {/each}
        {/snippet}
      </RatingGroup.Context>
    </RatingGroup.Control>
    <RatingGroup.HiddenInput />
  </RatingGroup>
  <div class="text-3xl text-center w-full font-bold text-yellow-500">
    Score: {m_data.score}/10
  </div>
  <div class="mb-2 p-4 text-2xl text-center">
    "{m_data.comment}"
  </div>
</div>
