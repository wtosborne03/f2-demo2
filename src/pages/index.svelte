<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { onMount, onDestroy } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import { get } from "svelte/store";
  import { toaster } from "$lib/util/toaster";
  import SelfieCapture from "$lib/components/SelfieCapture.svelte";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  $: name =
    $session.data?.user.name || (browser && localStorage.getItem("name")) || "";

  let step = "join"; // "join" | "selfie"

  onDestroy(() => {});

  const updateName = async (new_name: string) => {
    try {
      const client = await apiClient;
      if (client) {
        await client.putUsersName({}, { name: new_name });
      }
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

  const startJoinFlow = async () => {
    roomCode = roomCode.trim().toUpperCase();
    name = name.substring(0, 10).trim();
    if (!roomCode || !name) {
      toaster.error({
        title: "Error",
        description: "Please enter both Room Code and Name.",
      });
      return;
    }

    const user = get(session).data?.user;
    if (user) {
      try {
        const client = await apiClient;
        if (client) {
          const { data: me } = await client.getUsersMe();
          if (me.avatar_selfie) {
            joinRoom();
            return;
          }
        }
        step = "selfie";
      } catch (e) {
        step = "selfie";
      }
    } else {
      const localSelfie = localStorage.getItem("temp_selfie");
      if (localSelfie) {
        joinRoom();
        return;
      }
      step = "selfie";
    }
  };

  const joinRoom = async () => {
    const user = get(session).data?.user;
    let userId = user?.id;
    if (!userId) {
      userId = localStorage.getItem("temp_user_id") || "";
      if (!userId) {
        userId = "temp_" + crypto.randomUUID();
        localStorage.setItem("temp_user_id", userId);
      }
    }
    if (user) {
      await updateName(name);
    }
    gameClient.join(roomCode.toUpperCase(), name, userId);
  };
</script>

<div
  class="w-full absolute top-0 right-0 p-6 flex flex-row justify-end items-center"
>
  <button
    type="button"
    class="btn btn-secondary btn-lg flex items-center gap-2"
    onclick={() => sideBarOpen.set(true)}
  >
    {#if $session.data?.user}
      <i class="fa-solid fa-circle-user text-xl"></i>
      <span>Account</span>
    {:else}
      <i class="fa-solid fa-right-to-bracket text-xl"></i>
      <span>Log In</span>
    {/if}
  </button>
</div>

<div
  class="flex flex-col items-center justify-center h-full w-full max-w-md px-6 space-y-8 flex-1"
>
  <!-- Animated Logo -->
  <figure class="flex flex-col items-center h-48 mb-2">
    <img src={logo} alt="logo" class="object-contain h-full drop-shadow-2xl" />
  </figure>

  {#if step === "join"}
    <div class="flex flex-col gap-6 w-full mt-6">
      <label class="input w-full input-lg">
        Room Code
        <input
          id="room-code-field"
          type="text"
          bind:value={roomCode}
          class="input uppercase input-lg"
          placeholder="ABCD"
        />
      </label>
      <label class="input w-full input-lg">
        Name
        <input
          type="text"
          bind:value={name}
          class="input input-lg"
          placeholder=""
        />
      </label>
      <button class="btn btn-lg" onclick={startJoinFlow}> Join Game </button>
    </div>
  {:else if step === "selfie"}
    <SelfieCapture
      initialMode="camera"
      onUploadComplete={() => joinRoom()}
      onSkip={() => joinRoom()}
    />
  {/if}
</div>
