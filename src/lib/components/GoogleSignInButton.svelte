<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Google"
    class="flex items-center justify-between h-12 bg-[#f2f2f2] px-2 py-1.5 rounded-md pr-3"
    on:click={onClick}
>
    <Icon
        icon="material-icon-theme:google"
        font-size="2rem"
        class="mr-2 text-white"
    />
    <span class="text-[1rem] text-black font-medium">Continue with Google</span>
</button>
