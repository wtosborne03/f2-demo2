<script lang="ts">
  import { goto } from "$app/navigation";
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";
  import SelfieCapture from "$lib/components/SelfieCapture.svelte";
</script>

<svelte:head>
  <title>Your Avatar - Couch Cup</title>
  <meta
    name="description"
    content="Preview or change your Couch Cup avatar selfie."
  />
</svelte:head>

<div class="avatar-page">
  <header class="app-bar">
    <Button
      variant="filled"
      size="l"
      onclick={() => goto("/")}
      id="back-to-home-btn"
    >
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
    <h1 class="app-bar-title" id="avatar-page-title">Your Avatar</h1>
    <div class="app-bar-spacer"></div>
  </header>

  <main class="content-area">
    <SelfieCapture initialMode="auto" />
  </main>
</div>

<style>
  .avatar-page {
    background-color: var(--m3c-background);
    color: var(--m3c-on-background);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .app-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background-color: var(--m3c-surface-container);
    border-bottom: 1px solid var(--m3c-outline-variant);
  }

  .app-bar-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.2;
    font-weight: 500;
    color: var(--m3c-on-background);
    margin: 0;
  }

  .app-bar-spacer {
    flex: 1;
  }

  .content-area {
    max-width: 30rem;
    margin: 0 auto;
    width: 100%;
    padding: 2rem 1.5rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
