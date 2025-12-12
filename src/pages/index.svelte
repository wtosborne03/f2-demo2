<script lang="ts">
  import { joinRoom } from "$lib/gameService";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { drawerSettings } from "$lib/config/drawer";
  import { onMount } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import Icon from "@iconify/svelte";
    import { openModal } from "../stores/modal";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  let name = (browser && localStorage.getItem("name")) || "";

  session.subscribe((s) => {
    if (s.data?.user.name) {
      name = s.data.user.name;
    }
  });

  const updateName = async (new_name: string) => {
    try {
      const client = await apiClient;
      await client!.putUsersName({}, { name: new_name });
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  onMount(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("code") != null) {
      roomCode = sp.get("code") || "";
    }
  });

  const joinGame = async () => {
    name = name.substring(0, 10);
    name = name.trim();
    if ($session.data?.user === null) {
    } else {
      updateName(name);
    }
    joinRoom(roomCode.toUpperCase(), name);
  };
</script>

<div class="w-full flex flex-row justify-end items-center">
  <button
    class="btn preset-filled shadow-lg py-2 hover:scale-105 transition-transform"
    on:click={() => {
      sideBarOpen.set(true);
    }}
    >{#if $session.data?.user}
      <span class="">Account</span>
      <Icon icon="mdi:account-box" class="ml-0 text-xl"></Icon>
    {:else}
      <span class="">Log In</span>
      <Icon icon="uil:signin" class="ml-0 text-2xl"></Icon>
    {/if}
  </button>
</div>

<div class="container h-full mx-auto flex justify-center items-center px-4">
  <div class="space-y-4 text-center flex flex-col items-center w-full max-w-md">
    <!-- Animated Logo -->
    <figure class="flex flex-col items-center h-64">
      <section class="img-bg" />
      <img
        src={logo}
        alt="logo"
        class="object-contain h-full drop-shadow-2xl"
      />
    </figure>
    <!-- / -->

    <div class="space-y-1 w-full">
      <label class="label">
        <span class="flex items-center gap-2 text-lg font-semibold">
          <Icon icon="mdi:key-variant" class="text-xl text-primary-500"></Icon>
          Room Code
        </span>
        <div class="relative">
          <input
            type="text"
            class="input text-center text-2xl h-16 tracking-widest font-bold bg-surface-700/50 backdrop-blur-sm border-2 border-primary-500/30 focus:border-primary-500 transition-colors shadow-lg"
            id="p_code"
            style="text-transform:uppercase"
            name="Room Code"
            maxlength="4"
            placeholder="ABCD"
            bind:value={roomCode}
          />
        </div>
      </label>
      <label class="label">
        <span class="flex items-center gap-2 text-lg font-semibold">
          <Icon icon="mdi:account" class="text-xl text-secondary-500"></Icon>
          Name
        </span>
        <div class="relative">
          <input
            type="text"
            class="input text-center h-16 text-xl bg-surface-700/50 backdrop-blur-sm border-2 border-secondary-500/30 focus:border-secondary-500 transition-colors shadow-lg"
            id="p_name"
            maxlength="10"
            name="Name"
            placeholder="Your Name"
            bind:value={name}
          />
        </div>
      </label>
      <button
        class="rounded-3xl mt-5 preset-filled-secondary-500 px-5  items-center w-full text-xl py-4 hover:scale-[1.03] hover:bg-linear-to-br from-red-300 to-purple-600 transition-all hover:text-white font-bold"
        id="joinButton"
        on:click={joinGame}
      >
        Join Game
      </button>
    </div>
  </div>
</div>
