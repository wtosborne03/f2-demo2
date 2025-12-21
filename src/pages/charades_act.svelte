<script lang="ts">
    import { gameClient } from "$lib/gameService";
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import { player_state } from "../stores/player_state";
    import type { CharadesData } from "../types/page_data";

    let m_data: CharadesData;
    m_data = get(player_state).pageData;

    function confirm() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "confirm",
                confirm: {},
            },
        });
    }
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center text-center p-6"
>
    <div
        class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-8 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
    >
        <div class="text-6xl mb-6">🎭</div>
        <h3 class="text-4xl font-bold mb-6 text-purple-300">
            Time to Perform!
        </h3>
        <div
            class="bg-black/40 rounded-2xl p-6 mb-8 border-2 border-purple-400/50"
        >
            <h5 class="text-2xl font-semibold text-yellow-300">
                {m_data.prompt}
            </h5>
        </div>
        <p class="text-lg text-gray-300 mb-8 italic">
            Act it out - no words allowed! 🤫
        </p>
        <button
            style="font-size: 1.75rem;"
            class="btn preset-filled-error-500 px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
            on:click={confirm}>✓ I'm Done Acting!</button
        >
    </div>
</div>
