<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { drawerSettings } from "$lib/config/drawer";
  import { onMount } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import { openModal } from "../stores/modal";
  import { get } from "svelte/store";
  import { Button, TextFieldOutlined, Icon, Card } from "m3-svelte";
  import iconKey from "@ktibow/iconset-material-symbols/vpn-key";
  import iconPerson from "@ktibow/iconset-material-symbols/person";
  import iconAccount from "@ktibow/iconset-material-symbols/account-circle";
  import iconLogin from "@ktibow/iconset-material-symbols/login";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  $: name =
    $session.data?.user.name || (browser && localStorage.getItem("name")) || "";

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
    name = name.substring(0, 10).trim();
    const user = get(session).data?.user;
    if (user === null) {
    } else {
      updateName(name);
    }
    gameClient.join(roomCode.toUpperCase(), name, user?.id);
  };
</script>

<div
  class="w-full absolute top-0 right-0 p-6 flex flex-row justify-end items-center"
>
  <Button variant="tonal" onclick={() => sideBarOpen.set(true)}>
    {#if $session.data?.user}
      <Icon icon={iconAccount} />
      <span>Account</span>
    {:else}
      <Icon icon={iconLogin} />
      <span>Log In</span>
    {/if}
  </Button>
</div>

<div
  class="flex flex-col items-center justify-center h-full w-full max-w-md px-6 space-y-8 flex-1"
>
  <!-- Animated Logo -->
  <figure class="flex flex-col items-center h-48 mb-2">
    <img src={logo} alt="logo" class="object-contain h-full drop-shadow-2xl" />
  </figure>

  <!-- Login Card container -->
  <div class="card-wrapper w-full">
    <Card variant="elevated">
      <div class="flex flex-col gap-6 w-full">
        <div class="input-container w-full">
          <TextFieldOutlined
            label="Room Code"
            leadingIcon={iconKey}
            maxlength={4}
            placeholder="ABCD"
            bind:value={roomCode}
            class="text-center text-2xl font-bold tracking-widest uppercase"
          />
        </div>

        <div class="input-container w-full">
          <TextFieldOutlined
            label="Name"
            leadingIcon={iconPerson}
            maxlength={10}
            placeholder="Your Name"
            bind:value={name}
            class="text-center text-xl"
          />
        </div>

        <div class="btn-wrapper w-full">
          <Button variant="filled" size="m" onclick={joinGame}>Join Game</Button
          >
        </div>
      </div>
    </Card>
  </div>
</div>

<style>
  /* Style Card Container */
  .card-wrapper :global(.m3-container) {
    width: 100%;
    padding: 2.5rem !important; /* Generous internal padding */
    box-shadow: var(--m3-elevation-3) !important; /* Elegant depth shadow */
    border-radius: var(
      --m3-shape-large
    ) !important; /* Custom modern rounded card */
  }

  /* Style Text Field Outlines */
  .input-container :global(.m3-container) {
    width: 100%;
    height: 4.5rem; /* Larger and thicker fields */
  }
  .input-container :global(input) {
    font-size: 1.5rem !important; /* Bold inputs */
    padding-inline-start: 3.75rem !important; /* Center inputs horizontally but keep leading icon clear */
    padding-inline-end: 1.5rem !important;
    border-radius: var(--m3-shape-medium) !important;
  }
  .input-container :global(label) {
    font-size: 1.15rem !important;
    inset-inline-start: 3.25rem !important;
  }

  /* Sliding animation label position fixes */
  .input-container :global(input:focus ~ label),
  .input-container :global(input:not(:placeholder-shown) ~ label) {
    font-size: 0.9rem !important;
    inset-inline-start: 1.25rem !important;
  }
  .input-container :global(.layer) {
    border-radius: var(--m3-shape-medium) !important;
  }

  /* Style Action Button */
  .btn-wrapper :global(.m3-container) {
    width: 100%;
    height: 4rem; /* Spacious height for button */
    font-size: 1.35rem !important;
    font-weight: 800 !important;
    margin-top: 1rem;
    border-radius: var(--m3-shape-medium) !important;
  }
</style>
