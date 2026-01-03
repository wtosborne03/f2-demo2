<script lang="ts">
    import Icon from "@iconify/svelte";

    let { onSubmit }: { onSubmit: () => void } = $props();
</script>

<button
    class="btn preset-filled-primary-500 px-4 py-2 corner-squircle rounded-[3rem] corner-s text-lg font-bold text-white mt-12"
    onclick={onSubmit}
    >Submit <Icon
        font-size="3rem"
        class="ml-3"
        icon="streamline-flex:mail-send-email-message-circle"
    /></button
>
