<script lang="ts">
  import { Dialog, Button } from "m3-svelte";
  import { onDestroy } from "svelte";
  import { modalStore, closeModal } from "../../stores/modal";
  import { derived } from "svelte/store";

  const subs = modalStore.subscribe(() => {});
  onDestroy(() => subs());

  const state = derived(modalStore, ($m) => $m);

  let open = false;
  $: open = $state.open;
</script>

<Dialog
  headline={$state.title || "Modal"}
  bind:open={open}
  onclose={() => closeModal()}
>
  {#if $state.description}
    <p class="description">{$state.description}</p>
  {/if}
  {#if $state.component}
    <svelte:component this={$state.component} {...$state.props} />
  {/if}

  {#snippet buttons()}
    <Button variant="text" onclick={() => closeModal()}>Close</Button>
  {/snippet}
</Dialog>

<style>
  .description {
    font-family: var(--m3-font); font-size: 0.875rem; line-height: 1.429; font-weight: 400;
    color: var(--m3c-on-surface-variant);
    margin-bottom: 1rem;
  }
</style>
