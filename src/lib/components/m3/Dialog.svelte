<script lang="ts">
  import { type Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    headline: string;
    icon?: any;
    open: boolean;
    onclose?: () => void;
    buttons?: Snippet;
    children?: Snippet;
  }

  let {
    headline,
    icon,
    open = $bindable(false),
    onclose,
    buttons,
    children
  }: Props = $props();

  function close() {
    open = false;
    onclose?.();
  }
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box bg-base-100 border border-base-200 shadow-2xl">
      {#if icon}
        <div class="flex justify-center mb-3">
          <Icon {icon} size={32} class="text-primary" />
        </div>
      {/if}
      <h3 class="font-bold text-lg text-center mb-4">{headline}</h3>
      <div class="py-2 text-sm text-base-content/80">
        {@render children?.()}
      </div>
      <div class="modal-action">
        {#if buttons}
          {@render buttons()}
        {:else}
          <button class="btn btn-sm" onclick={close}>Close</button>
        {/if}
      </div>
    </div>
    <!-- Click backdrop to close -->
    <button class="modal-backdrop bg-black/40" onclick={close}>close</button>
  </dialog>
{/if}
