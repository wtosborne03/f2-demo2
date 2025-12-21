<script lang="ts">
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import { player_state } from "../stores/player_state";
    import type { CharadesData, CharadesResultsData } from "../types/page_data";
    import { RatingGroup } from "@skeletonlabs/skeleton-svelte";

    let m_data: CharadesResultsData;
    m_data = get(player_state).pageData;
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center p-6"
>
    <div
        class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-8 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
    >
        <div class="text-6xl mb-6">🎭</div>
        <h3 class="text-4xl font-bold mb-6 text-purple-300 text-center">
            Performance Results
        </h3>
        <div
            class="bg-black/40 rounded-2xl p-6 mb-6 border-2 border-purple-400/50"
        >
            <p class="text-lg text-gray-400 mb-2">Your Guess:</p>
            <div class="text-2xl font-semibold text-white">
                {m_data.guess}
            </div>
        </div>
        <div class="mb-6">
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
        </div>
        <div class="text-4xl text-center w-full font-bold text-yellow-300 mb-6">
            🌟 Score: {m_data.score}/10 🌟
        </div>
        <div class="bg-blue-900/30 rounded-xl p-6 border-2 border-blue-500/50">
            <p class="text-2xl text-center italic text-blue-200">
                "{m_data.comment}"
            </p>
        </div>
    </div>
</div>
