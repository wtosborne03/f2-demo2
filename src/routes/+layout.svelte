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

