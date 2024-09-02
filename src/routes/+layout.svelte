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

  import doubloon from "$lib/assets/icons/doubloon.png";

  let score = 0;
  let name = "";
  let admin = false;
  player_state.subscribe((value: PlayerState) => {
    score = value.score;
    name = value.name;
    admin = value.admin;
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
        <strong class="text-xl uppercase">JG</strong>
      </svelte:fragment>
      <span class="text-xl">{name}</span>
      {#if admin}
        <span class="text-md">[Admin]</span>
      {/if}
      <svelte:fragment slot="trail">
        <span class="text-xl flex flex-row items-center justify-center gap-2"
          >{score}
          <img class="w-8 h-8" src={doubloon} alt="coin" /></span
        >
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>
  <!-- Page Route Content -->
  <slot />
</AppShell>
