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
  import { onMount } from "svelte";

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

  onMount(() => {
    if (!browser) return;
    const applyInsets = (top: number, bottom: number, left: number, right: number) => {
      document.documentElement.style.setProperty("--safe-top", `${top}px`);
      document.documentElement.style.setProperty("--safe-bottom", `${bottom}px`);
      document.documentElement.style.setProperty("--safe-left", `${left}px`);
      document.documentElement.style.setProperty("--safe-right", `${right}px`);
    };

    try {
      const raw = (window as any).CouchCupAndroid?.getSafeInsets?.();
      if (raw) {
        const insets = JSON.parse(raw);
        applyInsets(insets.top || 0, insets.bottom || 0, insets.left || 0, insets.right || 0);
      }
    } catch (e) {}

    const handleInsetsEvent = (e: any) => {
      if (e.detail) {
        applyInsets(e.detail.top || 0, e.detail.bottom || 0, e.detail.left || 0, e.detail.right || 0);
      }
    };

    window.addEventListener("couchcup_safe_insets", handleInsetsEvent);
    return () => {
      window.removeEventListener("couchcup_safe_insets", handleInsetsEvent);
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

