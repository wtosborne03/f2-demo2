<script lang="ts">
  import { get } from "svelte/store";
  import type { matchData, PromptData } from "../types/page_data";
  import CardSwiper from "$lib/components/CardSwiper/CardSwiper.svelte";
  import type { CardData, Direction } from "$lib/components/CardSwiper";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let m_data: matchData;
  m_data = get(gameState).page_data;

  let liked_players: string[] = [];

  function done() {
    gameClient.sendPlayerInput("multiVote", {
      answers: liked_players,
    });
  }

  const swipe = (cardInfo: {
    direction: Direction;
    element: HTMLElement;
    data: CardData;
    index: number;
  }) => {
    if (cardInfo.direction == "right") {
      const player = Object.keys(m_data.matches)[cardInfo.index];
      liked_players.push(player);
    }
  };

  let data = (index: number) => {
    console.log(index);
    if (!m_data?.matches) {
      return {
        title: "No matches",
        description: "No matches",
        image: "",
        age: 0,
        job: "",
      };
    }
    if (index > Object.keys(m_data.matches).length) {
      done();
    }
    const match_author = Object.keys(m_data.matches)[index];
    const match_person = m_data.matches[match_author].match;

    return {
      title: match_person.name,
      description: match_person.description,
      image: match_person.sketch,
      age: match_person.age,
      job: match_person.job,
    };
  };
</script>

<div class="h-full w-screen">
  <CardSwiper cardData={data} onSwipe={swipe} />
</div>
