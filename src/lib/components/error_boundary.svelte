<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  export let fallback: any | undefined = undefined;
  export let component;

  let hasError = false;

  function handleError(error: any) {
    console.error("ErrorBoundary caught an error:", error);
    hasError = true;
  }
</script>

{#if hasError}
  {#if fallback}
    {fallback}
  {:else}
    <div>An error occurred.</div>
  {/if}
{:else}
  <svelte:component this={component} on:error={handleError} />
{/if}
