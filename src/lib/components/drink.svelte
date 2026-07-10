<script lang="ts">
    export let prompt: string | undefined;
</script>

{#if prompt}
    <div class="absolute top-1/3 justify-center items-center text-center">
        <p
            class=" text-[1.75rem] md:text-[2.75rem] font-black tracking-tight text-white text-shadow-2xs"
        >
            {prompt}
        </p>
    </div>
{/if}
