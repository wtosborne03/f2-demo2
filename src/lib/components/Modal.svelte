<script lang="ts">
  import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
  import { onDestroy } from "svelte";
  import { modalStore, closeModal } from "../../stores/modal";
  import { derived } from "svelte/store";
  import type { SvelteComponent } from "svelte";

  const subs = modalStore.subscribe(() => {});
  onDestroy(() => subs());

  const state = derived(modalStore, ($m) => $m);
</script>

{#if $state.open}
  <Dialog
    open={$state.open}
    onOpenChange={(e) => {
      if (!e) closeModal();
    }}
    aria-label={$state.title || "Modal"}
  >
    <Portal>
      <Dialog.Backdrop
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
      <Dialog.Positioner
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <Dialog.Content
          class="bg-surface-100-900 w-content mx-2 pt-6 px-6 pb-4 rounded-2xl flex flex-col justify-center items-center gap-4 shadow-2xl overflow-hidden"
        >
        
              {#if $state.title}
                <Dialog.Title class="text-lg font-semibold leading-tight"
                  >{$state.title}</Dialog.Title
                >
              {/if}
              {#if $state.description}
                <Dialog.Description class="text-sm text-muted-foreground"
                  >{$state.description}</Dialog.Description
                >
              {/if}
          {#if $state.component}
            <svelte:component this={$state.component} {...$state.props} />
          {/if}

          <button
            class="btn preset-filled-tertiary-500"
            on:click={() => closeModal()}>Close</button
          >
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
