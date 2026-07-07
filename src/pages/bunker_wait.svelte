<script lang="ts">
    import { get } from "svelte/store";
    import { gameState } from "$lib/wsapi/gameClient";
    import { playerEmote } from "$lib/avatar/player_emote";

    const pageData = get(gameState).page_data;
</script>

<div
    class="container h-full mx-auto flex flex-col justify-center items-center"
    on:click={playerEmote}
>
    <div class="text-2xl font-bold mb-4">
        {pageData?.message || "Waiting..."}
    </div>
</div>
