<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { matchData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";
  import CardSwiper from "$lib/CardSwiper/CardSwiper.svelte";

  let m_data: matchData;
  m_data = get<PlayerState>(player_state).page_data;

  let data = (index: number) => {
    const match_author = Object.keys(m_data.matches)[index];
    const match_person = m_data.matches[match_author];
    console.log(match_person);

    return {
      title: match_person.name,
      description: match_person["description"],
      image: match_person["sketch"],
    };
  };
</script>

<div class="h-screen w-screen fixed">
  <CardSwiper cardData={data} />
</div>
