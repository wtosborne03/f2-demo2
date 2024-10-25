<script>
  import { fade } from "svelte/transition";
  import { joinRoom } from "$lib/index";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import {
    Toast,
    Drawer,
    getDrawerStore,
    initializeStores,
  } from "@skeletonlabs/skeleton";
  import { drawerSettings } from "$lib/drawer";
  import { onMount } from "svelte";
  import { get, writable } from "svelte/store";
  import { supabase } from "../supabaseClient";
  import { authStore } from "$lib/stores/authStore";
  import { player_state } from "../stores/player_state";

  let roomCode = (browser && localStorage.getItem("code")) || "";
  const sp = new URLSearchParams(window.location.search);
  if (sp.get("code") != null) {
    roomCode = sp.get("code") || "";
  }
  let name = (browser && localStorage.getItem("name")) || "";

  const fetchName = async () => {
    if (!$authStore.user) return;
    const { error, data } = await supabase
      .from("users")
      .select("*")
      .eq("id", $authStore.user?.id)
      .single();
    if (error) {
      console.error(error);
    } else {
      name = data.game_name;
    }
  };

  $authStore.user, fetchName();

  const drawerStore = getDrawerStore();

  const joinGame = async () => {
    await fetchName();
    joinRoom(roomCode.toUpperCase(), name);
  };
</script>

<div class="w-full flex flex-row justify-end items-center">
  <button
    class="btn variant-filled"
    on:click={() => drawerStore.open(drawerSettings)}
    >{#if $authStore.user}
      Account <i class="fa-solid fa-user ml-2"></i>
    {:else}
      Log In <i class="fa-solid fa-right-to-bracket ml-2"></i>
    {/if}
  </button>
</div>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="space-y-10 text-center flex flex-col items-center">
    <!-- Animated Logo -->
    <figure class="flex flex-col items-center h-72">
      <section class="img-bg" />
      <img src={logo} alt="logo" class="object-contain h-full" />
    </figure>
    <!-- / -->

    <div class="space-y-2">
      <label class="label"
        ><span>Room Code</span>
        <input
          type="text"
          class="input"
          style="text-transform:uppercase"
          name="Room Code"
          maxlength="4"
          bind:value={roomCode}
        />
      </label>
      {#if !$authStore.user}
        <label class="label"
          ><span>Name</span>
          <input
            type="text"
            class="input"
            maxlength="10"
            name="Name"
            bind:value={name}
          />
        </label>
      {/if}
      <button class="btn variant-filled" on:click={joinGame}>Join</button>
    </div>
  </div>
</div>

<style lang="postcss">
  figure {
    @apply flex relative flex-col;
  }
  figure svg,
  .img-bg {
    @apply w-64 h-64 md:w-80 md:h-80;
  }
  .img-bg {
    @apply absolute z-[-1] rounded-full blur-[50px] transition-all;
    animation:
      pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite,
      glow 5s linear infinite;
  }
  @keyframes glow {
    0% {
      @apply bg-primary-400/50;
    }
    33% {
      @apply bg-secondary-400/50;
    }
    66% {
      @apply bg-tertiary-400/50;
    }
    100% {
      @apply bg-primary-400/50;
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.5);
    }
  }
</style>
