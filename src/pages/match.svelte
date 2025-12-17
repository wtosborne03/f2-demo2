<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { matchData, PromptData } from "../types/page_data";
    import { player_state } from "../stores/player_state";
    import CardSwiper from "$lib/components/CardSwiper/CardSwiper.svelte";
    import type { CardData, Direction } from "$lib/components/CardSwiper";
    import { gameClient } from "$lib/gameService";

    let m_data: matchData;
    m_data = get(player_state).pageData;

    let liked_players: string[] = [];

    function done() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "multiVote",
                multiVote: {
                    answers: liked_players,
                },
            },
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

<div class="h-full w-screen fixed top-0 left-0">
    <CardSwiper cardData={data} onSwipe={swipe} />
</div>
