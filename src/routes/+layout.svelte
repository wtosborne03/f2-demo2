<script lang="ts">
  import "../app.css";
  import "../../node_modules/m3-svelte/package/etc/styles.css";
  import "../../node_modules/m3-svelte/package/etc/recommended-styles.css";
  import "m3-svelte/etc/layer";
  import { onMount, onDestroy } from "svelte";
  import AppBar from "$lib/components/layout/app_bar.svelte";
  import BgTimer from "$lib/components/layout/bg_timer.svelte";
  import { Dialog, Snackbar, Button } from "m3-svelte";
  import AuthBox from "$lib/components/SideBar.svelte";
  import { browser } from "$app/environment";
  import { sideBarOpen } from "../stores/sidebar";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import Footer from "$lib/components/layout/footer.svelte";
  import { gameState } from "$lib/wsapi/gameClient";

  let dialogOpen = false;
  const unsubDialog = sideBarOpen.subscribe((v) => {
    dialogOpen = v;
  });

  $: screen = $gameState.screen;
  $: timer_duration = $gameState.timer_duration;

  onDestroy(() => {
    unsubDialog();
  });
</script>

<Snackbar />

<Dialog headline="Account" bind:open={dialogOpen} onclose={() => sideBarOpen.set(false)}>
  <AuthBox />
  {#snippet buttons()}
    <Button variant="text" onclick={() => sideBarOpen.set(false)}>Close</Button>
  {/snippet}
</Dialog>

{#if page.url.pathname === "/" && screen != "index"}
  <AppBar />
  {#if timer_duration > 0}
    <BgTimer />
  {/if}
{/if}
<!-- Page Route Content -->
<slot />

<!-- Global modal -->
<Modal />
