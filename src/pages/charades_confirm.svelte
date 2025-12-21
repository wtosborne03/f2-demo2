<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import { player_state } from "../stores/player_state";
    import type { CharadesData } from "../types/page_data";
    import { gameClient } from "$lib/gameService";
    function confirm() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "confirm",
                confirm: {},
            },
        });
    }

    let m_data: CharadesData;
    m_data = get(player_state).pageData;
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center p-6"
>
    <div
        class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-8 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
    >
        <div class="text-6xl mb-6">🎭</div>
        <h3 class="text-4xl font-bold mb-4 text-purple-300 text-center">
            Your Acting Prompt
        </h3>
        <div
            class="bg-black/40 rounded-2xl p-6 mb-6 border-2 border-purple-400/50"
        >
            <div class="text-3xl font-bold text-yellow-300 text-center">
                {m_data.prompt}
            </div>
        </div>
        <div
            class="bg-red-900/30 rounded-xl p-6 mb-8 border-2 border-red-500/50"
        >
            <p class="text-xl font-semibold text-red-300 text-center">
                🤫 Do NOT reveal your prompt or say any part of it out loud!
            </p>
            <p class="text-lg text-gray-300 text-center mt-2 italic">
                (Pretty Please? 🥺)
            </p>
        </div>
        <button
            style="font-size: 1.75rem;"
            class="btn preset-filled w-full px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            on:click={confirm}>✨ Ready to Act! 🤹‍♂️</button
        >
    </div>
</div>
