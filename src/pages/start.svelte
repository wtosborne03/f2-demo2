<script lang="ts">
  import { playerEmote } from "$lib/avatar/player_emote";
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";

  const { useSession } = authClient;
  const session = useSession();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  <div class="text-xl">Joined Game 👍</div>

  {#if $session.data?.user}
    <div class=""></div>
  {:else}
    <div class="mt-16 opacity-75">
      (
      <span
        class="cursor-pointer text-blue-500 hover:text-blue-600"
        on:click={() => sideBarOpen.set(true)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
