<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Spotify"
    class="flex items-center justify-between h-12 bg-[#1abb53] px-3 py-7 rounded-md pr-3"
    on:click={onClick}
>
    <Icon icon="mdi:spotify" font-size="2.75rem" class="mr-2 text-white" />
    <span class="text-[1.25rem] text-white font-medium"
        >Continue with Spotify</span
    >
</button>
