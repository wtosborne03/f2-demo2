<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Spotify"
    class="flex items-center justify-between h-12 bg-[#1abb53] px-2 py-1.5 rounded-md pr-3"
    on:click={onClick}
>
    <Icon icon="mdi:spotify" font-size="2rem" class="mr-2 text-white" />
    <span class="text-[1rem] text-white font-medium">Continue with Spotify</span
    >
</button>
