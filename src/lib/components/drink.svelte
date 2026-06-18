<script lang="ts">
    export let prompt: string | undefined;
</script>

{#if prompt}
    <div class="max-w-md w-full mx-auto mt-6 z-10">
        <div
            class="bg-white/95 dark:bg-gray-950/95 border border-white/30 dark:border-white/10 rounded-2xl p-6 shadow-2xl transform transition hover:scale-105 duration-300"
        >
            <div class="flex flex-col justify-center items-center gap-2">
                <div class="text-6xl animate-bounce duration-1000">🍻</div>
                <h3 class="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mt-2">
                    Instructions
                </h3>
                <p
                    class="mt-2 text-2xl text-center font-black tracking-tight text-gray-900 dark:text-white"
                >
                    "{prompt}"
                </p>
            </div>
        </div>
    </div>
{/if}
