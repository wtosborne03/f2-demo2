<script lang="ts">
  import { snackbars } from "./snackbarStore";
  import { onDestroy } from "svelte";

  let activeSnackbars = $state<any[]>([]);

  const unsubscribe = snackbars.subscribe((value) => {
    activeSnackbars = value;
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div class="toast toast-end toast-bottom z-[100] p-4 pointer-events-none">
  {#each activeSnackbars as snack (snack.id)}
    <div class="alert alert-info shadow-lg flex items-center justify-between gap-4 pointer-events-auto max-w-sm rounded-xl">
      <span class="text-sm font-semibold">{snack.message}</span>
      {#if snack.actionText}
        <button
          type="button"
          class="btn btn-xs btn-ghost text-primary-content"
          onclick={() => {
            snack.onAction?.();
            snackbars.update((list) => list.filter((m) => m.id !== snack.id));
          }}
        >
          {snack.actionText}
        </button>
      {/if}
    </div>
  {/each}
</div>
