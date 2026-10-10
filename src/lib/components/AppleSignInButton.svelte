<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Apple"
    type="button"
    class="w-full flex items-center justify-between h-11 bg-[#121212] px-3.5 py-2 border-3 border-[#121212] shadow-[3px_3px_0px_#121212] hover:bg-[#262626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#121212] transition-all cursor-pointer font-headline"
    on:click={onClick}
>
    <Icon icon="mdi:apple" font-size="1.5rem" class="text-white shrink-0" />
    <span class="font-headline font-black text-sm uppercase tracking-wider text-white">
        Apple
    </span>
</button>
