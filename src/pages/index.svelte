<script lang="ts">
  import { joinRoom } from "$lib/gameService";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { drawerSettings } from "$lib/config/drawer";
  import { onMount } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";

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
    class="btn preset-filled"
    on:click={() => {
      sideBarOpen.set(true);
    }}
    >{#if $session.data?.user}
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
          id="p_code"
          style="text-transform:uppercase"
          name="Room Code"
          maxlength="4"
          bind:value={roomCode}
        />
      </label>
      <label class="label"
        ><span>Name</span>
        <input
          type="text"
          class="input"
          id="p_name"
          maxlength="10"
          name="Name"
          bind:value={name}
        />
      </label>
      <button class="btn preset-filled" id="joinButton" on:click={joinGame}
        >Join</button
      >
    </div>
  </div>
</div>
