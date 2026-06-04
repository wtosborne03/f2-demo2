<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { onMount, onDestroy } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import { get } from "svelte/store";
  import { Button, TextFieldOutlined, Icon } from "m3-svelte";
  import iconKey from "@ktibow/iconset-material-symbols/vpn-key";
  import iconPerson from "@ktibow/iconset-material-symbols/person";
  import iconAccount from "@ktibow/iconset-material-symbols/account-circle";
  import iconLogin from "@ktibow/iconset-material-symbols/login";
  import Compressor from "compressorjs";
  import Spinner from "$lib/components/spinner.svelte";
  import { toaster } from "$lib/util/toaster";
  import SelfieCapture from "$lib/components/SelfieCapture.svelte";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  $: name =
    $session.data?.user.name || (browser && localStorage.getItem("name")) || "";

  let step = "join"; // "join" | "selfie" | "uploading"

  onDestroy(() => {});

  async function processSelfieBlob(blob: File | Blob) {
    step = "uploading";
    new Compressor(blob, {
      quality: 0.5,
      maxWidth: 600,
      maxHeight: 600,
      async success(result) {
        try {
          const { url, landmarks } = await uploadSelfieImage(result);
          await joinRoom(url, landmarks);
        } catch (err: any) {
          console.error("Failed to upload selfie, falling back:", err);
          await joinRoom("");
        }
      },
      error(err) {
        console.error("Compression error:", err.message);
        joinRoom("");
      },
    });
  }

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
            joinRoom(me.avatar_selfie);
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
        joinRoom(localSelfie || undefined);
        return;
      }
      step = "selfie";
    }
  };

  const joinRoom = async (avatarSelfieUrl?: string, landmarks?: any) => {
    const user = get(session).data?.user;
    if (user) {
      await updateName(name);
    }
    if (avatarSelfieUrl) {
      if (user) {
        try {
          const client = await apiClient;
          await client!.putUsersAvatar(null, {
            avatar_emote: 0,
            avatar_eyes: 3,
            avatar_hair: 0,
            avatar_mouth: 0,
            avatar_selfie: avatarSelfieUrl,
            avatar_landmarks: landmarks ? JSON.stringify(landmarks) : null,
          });
        } catch (e) {
          console.error("Failed to save avatar selfie:", e);
        }
      } else {
        localStorage.setItem("temp_selfie", avatarSelfieUrl);
        if (landmarks) {
          localStorage.setItem("temp_landmarks", JSON.stringify(landmarks));
        } else {
          localStorage.removeItem("temp_landmarks");
        }
      }
    }
    gameClient.join(roomCode.toUpperCase(), name, user?.id);
  };

  async function uploadSelfieImage(
    file: File | Blob,
  ): Promise<{ url: string; landmarks: any }> {
    const formData = new FormData();
    formData.append("file", file, "selfie.png");

    const response = await fetch(
      `${import.meta.env.VITE_PUBLIC_API_URL}/upload?detect_landmarks=true`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    return await response.json();
  }
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

  {#if step === "join"}
    <div class="flex flex-col gap-6 w-full mt-6">
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
        <Button variant="filled" size="m" onclick={startJoinFlow}
          >Join Game</Button
        >
      </div>
    </div>
  {:else if step === "selfie"}
    <SelfieCapture
      onCapture={(blob) => processSelfieBlob(blob)}
      onSkip={() => joinRoom("")}
    />
  {:else if step === "uploading"}
    <div class="flex flex-col items-center justify-center py-10 gap-4">
      <Spinner />
      <span class="text-zinc-400 text-lg font-medium animate-pulse"
        >Processing selfie...</span
      >
    </div>
  {/if}
</div>

<style>
  /* Style Card Container */
  .card-wrapper :global(.m3-container) {
    width: 100%;
    padding: 2.5rem !important;
    box-shadow: var(--m3-elevation-3) !important;
    border-radius: var(--m3-shape-large) !important;
  }

  /* Style Text Field Outlines */
  .input-container :global(.m3-container) {
    width: 100%;
    height: 4.5rem;
  }
  .input-container :global(input) {
    font-size: 1.5rem !important;
    padding-inline-start: 3.75rem !important;
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
    height: 4rem;
    font-size: 1.35rem !important;
    font-weight: 800 !important;
    border-radius: var(--m3-shape-medium) !important;
  }
</style>
