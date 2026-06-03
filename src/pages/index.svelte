<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { drawerSettings } from "$lib/config/drawer";
  import { onMount, onDestroy } from "svelte";
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
  import Compressor from "compressorjs";
  import Spinner from "$lib/components/spinner.svelte";
  import { toaster } from "$lib/util/toaster";
  import Iconify from "@iconify/svelte";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  $: name =
    $session.data?.user.name || (browser && localStorage.getItem("name")) || "";

  let step = "join"; // "join" | "selfie" | "uploading"
  let fileinput: HTMLInputElement;
  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let cameraLoading = false;
  let cameraError: string | null = null;

  async function startCamera() {
    if (!browser) return;
    cameraLoading = true;
    cameraError = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 640 }
        }
      });
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(err => {
            console.error("Video play failed:", err);
          });
          cameraLoading = false;
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      cameraError = "Could not access camera. Please check permissions.";
      cameraLoading = false;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  $: if (browser) {
    if (step === "selfie") {
      setTimeout(() => {
        startCamera();
      }, 50);
    } else {
      stopCamera();
    }
  }

  onDestroy(() => {
    stopCamera();
  });

  async function captureSelfie() {
    if (!videoElement || !stream) return;
    
    try {
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      const width = settings.width || videoElement.videoWidth || 640;
      const height = settings.height || videoElement.videoHeight || 480;
      
      const canvas = document.createElement("canvas");
      const size = Math.min(width, height);
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
      
      const sx = (width - size) / 2;
      const sy = (height - size) / 2;
      ctx.drawImage(videoElement, sx, sy, size, size, 0, 0, size, size);
      
      canvas.toBlob((blob) => {
        if (blob) {
          processSelfieBlob(blob);
        } else {
          console.error("Failed to generate blob");
          toaster.error({ title: "Error", description: "Failed to capture image." });
        }
      }, "image/jpeg", 0.9);
    } catch (e: any) {
      console.error("Capture failed:", e);
      toaster.error({ title: "Error", description: "Camera capture failed." });
    }
  }

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
      if (localSelfie && false) {
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

  async function handleSelfieInput(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      await processSelfieBlob(file);
    } else {
      step = "selfie";
    }
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

  <!-- Login Card container -->

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
    <div class="flex flex-col gap-6 w-full mt-6 items-center animate-fade-in">
      <div class="text-center max-w-sm">
        <h2 class="text-2xl font-extrabold text-white mb-1">
          Create Custom Avatar! 📸
        </h2>
        <p class="text-zinc-400 text-sm leading-snug">
          Align your face in the circle below to project onto your 3D avatar.
        </p>
      </div>

      <input
        style="display:none"
        type="file"
        accept="image/*"
        capture="user"
        onchange={handleSelfieInput}
        bind:this={fileinput}
      />

      <!-- Camera Viewport Container -->
      <div class="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-zinc-700/80 shadow-2xl bg-zinc-950 flex items-center justify-center">
        {#if cameraLoading}
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950 text-zinc-400">
            <Spinner />
            <span class="text-xs font-semibold uppercase tracking-wider">Starting Camera...</span>
          </div>
        {/if}

        {#if cameraError}
          <div class="absolute inset-0 p-4 flex flex-col items-center justify-center gap-3 text-center bg-zinc-950">
            <Iconify icon="material-symbols:videocam-off-outline" class="text-red-400 text-4xl" />
            <p class="text-xs text-zinc-400 px-2 leading-tight">{cameraError}</p>
            <button 
              type="button"
              onclick={startCamera} 
              class="px-4 py-2 bg-zinc-800 text-white text-xs font-bold rounded-lg border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
            >
              Retry Camera
            </button>
          </div>
        {:else}
          <video
            bind:this={videoElement}
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover scale-x-[-1]"
          ></video>

          <!-- SVG Face Guide Overlay -->
          <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full pointer-events-none text-white/40 drop-shadow">
            <!-- Face outline -->
            <path d="M 50,15 C 25,15 25,65 50,85 C 75,65 75,15 50,15 Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3,3" />
            <!-- Eye guide marks -->
            <circle cx="38" cy="45" r="2.2" fill="currentColor" opacity="0.6" />
            <circle cx="62" cy="45" r="2.2" fill="currentColor" opacity="0.6" />
            <!-- Mouth guide mark -->
            <path d="M 44,65 Q 50,68 56,65" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.6" />
          </svg>
        {/if}
      </div>

      <div class="w-full flex flex-col gap-3">
        {#if !cameraError}
          <!-- Capture Shutter Button (glowing glassmorphism) -->
          <button
            type="button"
            onclick={captureSelfie}
            disabled={cameraLoading}
            class="w-full h-14 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-bold text-lg rounded-full flex items-center justify-center gap-2 border-4 border-zinc-800 shadow-xl transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Iconify
              icon="material-symbols:photo-camera-outline"
              style="font-size: 1.5rem;"
            />
            Take Photo
          </button>
        {/if}

        <div class="flex gap-2 w-full">
          <Button
            variant="outlined"
            onclick={() => fileinput.click()}
            class="flex-1 h-12 font-medium text-sm"
          >
            <Iconify
              icon="material-symbols:image-outline"
              style="font-size: 1.2rem; margin-right: 0.25rem;"
            />
            Upload File
          </Button>

          <Button
            variant="tonal"
            onclick={() => joinRoom("")}
            class="flex-1 h-12 font-medium text-sm"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
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
    border-radius: var(--m3-shape-medium) !important;
  }
</style>
