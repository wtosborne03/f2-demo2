<script lang="ts">
    export let prompt: string;
</script>

<div class="max-w-md w-full mx-auto mt-6">
    <div
        class="bg-white dark:bg-gray-800 border border-primary-500 rounded-2xl p-5 shadow-lg transform transition"
    >
        <div class="flex flex-col justify-center items-center gap-1">
            <div class="text-5xl">🍻</div>
            <h3
                class="text-lg font-semibold text-primary-700 dark:text-primary-300"
            >
                Instructions
            </h3>
            <p
                class="mt-1 text-2xl text-center font-bold text-gray-900 dark:text-white"
            >
                "{prompt}"
            </p>
        </div>
    </div>
</div>
