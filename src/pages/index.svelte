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
  import Icon from "@iconify/svelte";

  const session = authClient.useSession();

  let roomCode = "";
  let name = (browser && localStorage.getItem("name")) || "";
  $: if ($session.data?.user?.name && !name) {
    name = $session.data.user.name;
  }

  let step = "join"; // "join" | "selfie"
  let isChecking = false;

  const handleSessionCleared = () => {
    roomCode = "";
  };

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

  onMount(async () => {
    gameClient.on("sessionCleared", handleSessionCleared);

    const sp = new URLSearchParams(window.location.search);
    const urlCode = sp.get("code");
    if (urlCode) {
      roomCode = urlCode.trim().toUpperCase();
      return;
    }

    const storedCode =
      (browser &&
        (localStorage.getItem("code") || localStorage.getItem("couch_room"))) ||
      "";
    if (storedCode) {
      const check = await gameClient.checkRoom(storedCode);
      if (check.valid) {
        roomCode = storedCode.trim().toUpperCase();
      } else {
        roomCode = "";
        if (browser) {
          localStorage.removeItem("code");
          localStorage.removeItem("couch_room");
          localStorage.removeItem("couch_pid");
        }
      }
    }
  });

  onDestroy(() => {
    gameClient.off("sessionCleared", handleSessionCleared);
  });

  const startJoinFlow = async () => {
    if (isChecking) return;

    roomCode = roomCode.trim().toUpperCase();
    name = name.substring(0, 10).trim();
    if (!roomCode || !name) {
      toaster.error({
        title: "Error",
        description: "Please enter both Room Code and Name.",
      });
      return;
    }

    isChecking = true;
    try {
      const check = await gameClient.checkRoom(roomCode);
      if (!check.valid) {
        toaster.error({
          title: "Cannot Join Room",
          description: check.error || "Room not found or no longer active.",
        });
        isChecking = false;
        return;
      }

      const user = get(session).data?.user;
      if (user) {
        try {
          const client = await apiClient;
          if (client) {
            const { data: me } = await client.getUsersMe();
            if (me.avatar_selfie) {
              await joinRoom();
              return;
            }
          }
          step = "selfie";
        } catch (e) {
          step = "selfie";
        }
      } else {
        const localSelfie =
          typeof window !== "undefined"
            ? localStorage.getItem("temp_selfie")
            : null;
        if (localSelfie) {
          await joinRoom();
          return;
        }
        step = "selfie";
      }
    } catch (err) {
      console.error("Join flow error:", err);
      toaster.error({
        title: "Error",
        description: "Failed to verify room. Please try again.",
      });
    } finally {
      isChecking = false;
    }
  };

  const joinRoom = async () => {
    const user = get(session).data?.user;
    let userId = user?.id;
    if (!userId) {
      userId =
        (typeof window !== "undefined" &&
          localStorage.getItem("temp_user_id")) ||
        "";
      if (!userId) {
        userId = "temp_" + crypto.randomUUID();
        if (typeof window !== "undefined") {
          localStorage.setItem("temp_user_id", userId);
        }
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
  <figure class="flex flex-col items-center h-64 mb-0">
    <img src={logo} alt="logo" class="object-contain h-full" />
  </figure>

  {#if step === "join"}
    <form
      class="flex flex-col gap-6 w-full mt-6"
      onsubmit={(e) => {
        e.preventDefault();
        startJoinFlow();
      }}
    >
      <span
        class="flex justify-between items-center w-full input input-xl pr-0"
      >
        <label for="room-code-field" class="w-24 flex items-center gap-2"
          >Code</label
        >
        <input
          id="room-code-field"
          name="roomCode"
          type="text"
          bind:value={roomCode}
          maxlength={4}
          autocomplete="off"
          autocorrect="off"
          autocapitalize="characters"
          spellcheck="false"
          enterkeyhint={name.trim() ? "go" : "next"}
          class="input uppercase input-xl input-ghost border-2 border-accent/35"
          placeholder="ABCD"
          oninput={() => {
            roomCode = roomCode.toUpperCase();
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (roomCode.trim() && name.trim()) {
                startJoinFlow();
              } else if (roomCode.trim() && !name.trim()) {
                document.getElementById("name-field")?.focus();
              } else {
                startJoinFlow();
              }
            }
          }}
        />
      </span>
      <span
        class="flex justify-between items-center w-full input input-xl pr-0"
      >
        <label for="name-field" class="w-24 flex items-center gap-2">Name</label
        >

        <input
          id="name-field"
          name="name"
          type="text"
          bind:value={name}
          maxlength={10}
          autocomplete="nickname"
          autocorrect="off"
          autocapitalize="words"
          spellcheck="false"
          enterkeyhint="go"
          class="input input-xl input-ghost border-2 border-accent/35"
          placeholder=""
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              startJoinFlow();
            }
          }}
        />
      </span>
      <button
        type="submit"
        class="btn btn-lg btn-primary flex items-center justify-center gap-2"
        disabled={isChecking}
      >
        {#if isChecking}
          <span class="loading loading-spinner loading-sm"></span>
          <span>Checking Room...</span>
        {:else}
          <span>Join Game</span>
          <Icon icon="mingcute:enter-door-fill" class="mb-1" />
        {/if}
      </button>
    </form>
  {:else if step === "selfie"}
    <SelfieCapture
      initialMode="camera"
      onUploadComplete={() => joinRoom()}
      onSkip={() => joinRoom()}
    />
  {/if}
</div>
