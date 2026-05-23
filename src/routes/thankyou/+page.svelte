<script lang="ts">
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";
</script>

<div class="thankyou-container">
  <div class="back-btn-wrapper">
    <Button variant="filled" onclick={() => goto("/")}>
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
  </div>
  
  <h1 class="thankyou-title">Thank you for your purchase!</h1>
  <p class="thankyou-subtitle">Your transaction completed successfully.</p>
</div>

<style>
  .thankyou-container {
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 32rem;
    margin: 0 auto;
    width: 100%;
    text-align: center;
  }

  .back-btn-wrapper {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 3rem;
  }

  .thankyou-title {
    font-family: var(--m3-font); font-size: 1.75rem; line-height: 1.286; font-weight: 400;
    color: var(--m3c-on-background);
    margin-bottom: 1rem;
  }

  .thankyou-subtitle {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 400;
    color: var(--m3c-on-surface-variant);
  }
</style>
