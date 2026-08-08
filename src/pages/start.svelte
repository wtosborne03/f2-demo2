<script lang="ts">
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import CatchphraseRecorder from "$lib/components/CatchphraseRecorder.svelte";

  const { useSession } = authClient;
  const session = useSession();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="container h-full mx-auto flex flex-col justify-center items-center px-4 max-w-md"
>
  <div class="text-xl font-bold mt-8 mb-4">Joined Game 👍</div>

  <CatchphraseRecorder />

  {#if $session.data?.user}
    <div class=""></div>
  {:else}
    <div class="mt-8 opacity-75 text-sm">
      (
      <span
        class="cursor-pointer text-blue-500 hover:text-blue-600 font-semibold"
        on:click={() => sideBarOpen.set(true)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
