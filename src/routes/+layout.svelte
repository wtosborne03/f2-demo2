<script lang="ts">
  import "../app.postcss";
  import { AppShell, AppBar } from "@skeletonlabs/skeleton";
  import { Toast, initializeStores } from "@skeletonlabs/skeleton";
  import type { PlayerState } from "../types/player_state";

  // Floating UI for Popups
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import { player_state } from "../stores/player_state";

  let score = 0;
  let name = "";
  player_state.subscribe((value: PlayerState) => {
    score = value.score;
    name = value.name;
  });
  initializeStores();
</script>

<Toast />
<!-- App Shell -->
<AppShell>
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar
      gridColumns="grid-cols-3"
      slotDefault="place-self-center"
      slotTrail="place-content-end"
    >
      <svelte:fragment slot="lead">
        <strong class="text-xl uppercase">Gg</strong>
      </svelte:fragment>
      <span class="text-xl">{name}</span>
      <svelte:fragment slot="trail">
        <span class="text-xl">Score: {score}</span>
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <!-- Page Route Content -->
  <slot />
</AppShell>
