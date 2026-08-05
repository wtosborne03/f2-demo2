<script lang="ts">
    import Icon from "@iconify/svelte";

    export let onClick: () => {};
</script>

<button
    aria-label="Continue with Google"
    class="flex items-center justify-between h-12 bg-[#f2f2f2] px-3 py-7 rounded-2xl pr-3 hover:bg-[#eaeaea]"
    on:click={onClick}
>
    <Icon
        icon="material-icon-theme:google"
        font-size="2.75rem"
        class="mr-2 text-white"
    />
    <span
        class="text-2xl text-black"
        style="font-family: 'Roboto', arial, sans-serif;">Google</span
    >
</button>
