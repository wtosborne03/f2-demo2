<script lang="ts">
  import { drawerSettings } from "$lib/drawer";
  import { playerEmote } from "$lib/player_emote";
  import { authStore } from "$lib/stores/authStore";
  import { getDrawerStore } from "@skeletonlabs/skeleton";

  const drawerStore = getDrawerStore();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  <div class="text-xl">Joined Game 👍</div>

  {#if $authStore.user}
    <div class=""></div>
  {:else}
    <div class="mt-16 opacity-75">
      (
      <span
        class="cursor-pointer text-blue-500 hover:text-blue-600"
        on:click={() => drawerStore.open(drawerSettings)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
