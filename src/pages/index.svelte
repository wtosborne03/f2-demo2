<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { onMount, onDestroy } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import { get } from "svelte/store";
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
          const { url, landmarks, gender } = await uploadSelfieImage(result);
          await joinRoom(url, landmarks, gender);
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
            let landmarks = undefined;
            if (me.avatar_landmarks) {
              try {
                landmarks = JSON.parse(me.avatar_landmarks);
              } catch (e) {
                console.error("Failed to parse user landmarks:", e);
              }
            }
            joinRoom(
              me.avatar_selfie,
              landmarks,
              me.avatar_gender || undefined,
            );
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
        let landmarks = undefined;
        const localLandmarksStr = localStorage.getItem("temp_landmarks");
        if (localLandmarksStr) {
          try {
            landmarks = JSON.parse(localLandmarksStr);
          } catch (e) {
            console.error("Failed to parse local landmarks:", e);
          }
        }
        const localGender = localStorage.getItem("temp_gender") || undefined;
        joinRoom(localSelfie || undefined, landmarks, localGender);
        return;
      }
      step = "selfie";
    }
  };

  const joinRoom = async (
    avatarSelfieUrl?: string,
    landmarks?: any,
    gender?: string,
  ) => {
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
            avatar_gender: gender || null,
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
        if (gender) {
          localStorage.setItem("temp_gender", gender);
        } else {
          localStorage.removeItem("temp_gender");
        }
      }
    }
    gameClient.join(roomCode.toUpperCase(), name, userId);
  };

  async function uploadSelfieImage(
    file: File | Blob,
  ): Promise<{ url: string; landmarks: any; gender?: string }> {
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
      onCapture={(blob) => processSelfieBlob(blob)}
      onSkip={() => joinRoom("")}
    />
  {:else if step === "uploading"}
    <div class="flex flex-col items-center justify-center py-10 gap-4">
      <Spinner />
      <span class="text-base-content text-lg font-medium animate-pulse"
        >Processing selfie...</span
      >
    </div>
  {/if}
</div>
