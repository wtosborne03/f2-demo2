<script lang="ts">
  import "../app.css";
  import "../../node_modules/m3-svelte/package/etc/styles.css";
  import "../../node_modules/m3-svelte/package/etc/recommended-styles.css";
  import "../../node_modules/m3-svelte/package/etc/tailwind-styles.css";
  import "m3-svelte/etc/layer";
  import AppBar from "$lib/components/layout/app_bar.svelte";
  import { Snackbar } from "m3-svelte";
  import SideBar from "$lib/components/SideBar.svelte";
  import { browser } from "$app/environment";
  import { sideBarOpen } from "../stores/sidebar";
  import { page } from "$app/state";
  import Modal from "$lib/components/Modal.svelte";
  import Footer from "$lib/components/layout/footer.svelte";
  import { gameState } from "$lib/wsapi/gameClient";

  const screen = $derived($gameState.screen);
</script>

<Snackbar />

<SideBar />

{#if page.url.pathname === "/" && screen != "index"}
  <AppBar />
{/if}
<!-- Page Route Content -->
<slot />

<!-- Global modal -->
<Modal />

