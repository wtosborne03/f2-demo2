<script lang="ts">
  import "../app.css";
  import AppBar from "$lib/components/layout/app_bar.svelte";
  import { Snackbar } from "m3-svelte";
  import SideBar from "$lib/components/SideBar.svelte";
  import { browser } from "$app/environment";
  import { sideBarOpen } from "../stores/sidebar";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import Footer from "$lib/components/layout/footer.svelte";
  import { gameState } from "$lib/wsapi/gameClient";
  import EmoteRippleLayer from "$lib/components/EmoteRippleLayer.svelte";
  import { requestScreenWakeLock, releaseScreenWakeLock } from "$lib/util/wakeLock";

  const screen = $derived($gameState.screen);

  $effect(() => {
    if (!browser) return;
    if (screen && screen !== "index") {
      requestScreenWakeLock();
    } else {
      releaseScreenWakeLock();
    }

    return () => {
      releaseScreenWakeLock();
    };
  });
</script>

<div class="bauhaus-shell min-h-dvh flex flex-col w-full bg-[var(--b-canvas)] text-[var(--b-black)] selection:bg-[var(--b-yellow)] selection:text-[var(--b-black)]">
  <EmoteRippleLayer />

  <Snackbar />

  <SideBar />

  {#if page.url.pathname === "/" && screen != "index"}
    <AppBar />
  {/if}

  <!-- Page Route Content -->
  <slot />

  <!-- Global modal -->
  <Modal />
</div>

