<script lang="ts">
  import "../app.css";
  import "../../node_modules/m3-svelte/package/etc/styles.css";
  import "../../node_modules/m3-svelte/package/etc/recommended-styles.css";
  import "m3-svelte/etc/layer";
  import AppBar from "$lib/components/layout/app_bar.svelte";
  import BgTimer from "$lib/components/layout/bg_timer.svelte";
  import { Snackbar, Button } from "m3-svelte";
  import Icon from "@iconify/svelte";
  import AuthBox from "$lib/components/SideBar.svelte";
  import { browser } from "$app/environment";
  import { sideBarOpen } from "../stores/sidebar";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import Footer from "$lib/components/layout/footer.svelte";
  import { gameState } from "$lib/wsapi/gameClient";

  const screen = $derived($gameState.screen);
  const timer_duration = $derived($gameState.timer_duration);

  let sidebarDialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!sidebarDialog) return;
    if ($sideBarOpen) {
      sidebarDialog.showModal();
    } else {
      sidebarDialog.close();
    }
  });

  function handleDialogClick(e: MouseEvent) {
    if (e.target === sidebarDialog) {
      sideBarOpen.set(false);
    }
  }
</script>

<Snackbar />

<dialog
  class="m3-sidebar-drawer"
  bind:this={sidebarDialog}
  onclick={handleDialogClick}
  onclose={() => sideBarOpen.set(false)}
>
  <div class="sidebar-header">
    <span class="sidebar-title">Account</span>
    <Button variant="text" onclick={() => sideBarOpen.set(false)}>
      <Icon icon="material-symbols:close-rounded" />
    </Button>
  </div>
  <div class="sidebar-content">
    <AuthBox />
  </div>
</dialog>

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

<style>
  dialog.m3-sidebar-drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 320px;
    height: 100vh;
    max-height: 100dvh;
    border: none;
    padding: 0;
    margin: 0;
    background-color: var(--m3c-surface-container);
    color: var(--m3c-on-surface);
    border-radius: 0 16px 16px 0;
    box-shadow: 0 8px 12px 6px rgba(0, 0, 0, 0.15), 0 4px 4px 0 rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    z-index: 50;

    /* Left-drawer slide-in transition */
    transform: translateX(-100%);
    transition:
      transform 300ms cubic-bezier(0.2, 0, 0, 1),
      opacity 300ms cubic-bezier(0.2, 0, 0, 1),
      display 300ms cubic-bezier(0.2, 0, 0, 1) allow-discrete;
  }

  dialog.m3-sidebar-drawer[open] {
    transform: translateX(0);
  }

  dialog.m3-sidebar-drawer::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition:
      opacity 300ms cubic-bezier(0.2, 0, 0, 1),
      display 300ms cubic-bezier(0.2, 0, 0, 1) allow-discrete;
  }

  dialog.m3-sidebar-drawer[open]::backdrop {
    opacity: 1;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 0.75rem 1.5rem;
  }

  .sidebar-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--m3c-on-surface);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 0.5rem;
  }
</style>
