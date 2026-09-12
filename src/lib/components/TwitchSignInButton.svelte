<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Twitch"
    class="flex items-center justify-between h-12 bg-[#9146FF] px-3 py-7 rounded-2xl pr-3 hover:bg-[#772ce8] active:bg-[#5c16c5] cursor-pointer transition-colors"
    on:click={onClick}
>
    <Icon icon="mdi:twitch" font-size="2.75rem" class="mr-2 text-white" />
    <span class="text-white text-2xl">Twitch</span>
</button>
