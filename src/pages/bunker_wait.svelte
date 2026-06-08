<script lang="ts">
    import { get } from "svelte/store";
    import { gameState } from "$lib/wsapi/gameClient";

    const pageData = get(gameState).page_data;
</script>

<div
    class="flex flex-col items-center justify-center h-full p-6 text-center"
    style="background-color: var(--m3c-surface-container); color: var(--m3c-on-surface);"
>
    <div class="text-2xl font-bold mb-4" style="color: var(--m3c-on-surface);">
        {pageData?.message || "Waiting..."}
    </div>
</div>
