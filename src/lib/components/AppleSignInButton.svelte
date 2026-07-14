<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Apple"
    class="flex items-center justify-between h-12 bg-black px-3 py-7 rounded-md pr-3 hover:bg-[#222] active:bg-black"
    on:click={onClick}
>
    <Icon icon="mdi:apple" font-size="2.75rem" class="mr-2 text-white" />
    <span class="text-[1.1rem] text-white font-medium">Apple</span>
</button>

