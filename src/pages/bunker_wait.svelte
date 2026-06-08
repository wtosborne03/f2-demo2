<script lang="ts">
    import { get } from "svelte/store";
    import { gameState } from "$lib/wsapi/gameClient";

    const pageData = get(gameState).page_data;
</script>

<div
    class="flex flex-col items-center justify-center h-full p-6 text-center"
    style="background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%); color: #e0e0e0;"
>
    <div class="text-2xl font-bold mb-4" style="color: #e0e0e0;">
        {pageData?.message || "Waiting..."}
    </div>
</div>
