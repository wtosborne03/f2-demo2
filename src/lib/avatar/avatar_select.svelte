<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { get } from "svelte/store";
  import Spinner from "$lib/components/spinner.svelte";
  import Icon from "@iconify/svelte";
  import { Button } from "m3-svelte";
  import { toaster } from "$lib/util/toaster";
  import { apiClient } from "$lib/backend/axios";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { authClient } from "../../stores/authStore";
  import SelfieCapture from "$lib/components/SelfieCapture.svelte";
  import Compressor from "compressorjs";

  const session = authClient.useSession();

  let mode: "preview" | "capture" | "uploading" = "preview";
  let currentSelfieUrl: string | null = null;
  let loading = true;

  $: if (!$session.isPending) {
    loadCurrentAvatar();
  }

  async function loadCurrentAvatar() {
    loading = true;
    try {
      const client = await apiClient;
      if (client) {
        const { data: me } = await client.getUsersMe();
        currentSelfieUrl = me.avatar_selfie || null;
      }
    } catch (e) {
      console.error("Failed to load avatar from backend, falling back to localStorage:", e);
      if (browser) {
        currentSelfieUrl = localStorage.getItem("temp_selfie") || null;
      }
    }
    loading = false;
  }

  async function handleCapture(blob: Blob) {
    mode = "uploading";
    new Compressor(blob, {
      quality: 0.5,
      maxWidth: 600,
      maxHeight: 600,
      async success(result) {
        try {
          const { url, landmarks } = await uploadSelfieImage(result);
          await saveAvatar(url, landmarks);
          currentSelfieUrl = url;
          toaster.success({
            title: "Avatar Updated",
            description: "Your new avatar has been saved.",
          });
        } catch (err: any) {
          console.error("Failed to upload selfie:", err);
          toaster.error({
            title: "Upload Failed",
            description: "Could not save your avatar. Please try again.",
          });
        }
        mode = "preview";
      },
      error(err) {
        console.error("Compression error:", err.message);
        toaster.error({
          title: "Error",
          description: "Failed to process image.",
        });
        mode = "preview";
      },
    });
  }

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

  async function saveAvatar(selfieUrl: string, landmarks?: any) {
    try {
      const client = await apiClient;
      await client!.putUsersAvatar(null, {
        avatar_emote: 0,
        avatar_eyes: 3,
        avatar_hair: 0,
        avatar_mouth: 0,
        avatar_selfie: selfieUrl,
        avatar_landmarks: landmarks ? JSON.stringify(landmarks) : null,
      });
    } catch (e) {
      console.error("Failed to save avatar to backend:", e);
    }

    // Always mirror to localStorage as local fallback
    if (browser) {
      localStorage.setItem("temp_selfie", selfieUrl);
      if (landmarks) {
        localStorage.setItem("temp_landmarks", JSON.stringify(landmarks));
      } else {
        localStorage.removeItem("temp_landmarks");
      }
    }

    // If in a game, send avatar update
    if (get(gameState).screen !== "index") {
      gameClient.sendInput({
        type: "avatarUpdate",
        avatar: {
          eyes: 3,
          hair: 0,
          mouth: 0,
          emote: 0,
          selfieUrl: selfieUrl,
          landmarks,
        },
      });
    }
  }

  async function removeAvatar() {
    const user = get(session).data?.user;
    if (user) {
      try {
        const client = await apiClient;
        await client!.putUsersAvatar(null, {
          avatar_emote: 0,
          avatar_eyes: 3,
          avatar_hair: 0,
          avatar_mouth: 0,
          avatar_selfie: null,
          avatar_landmarks: null,
        });
      } catch (e) {
        console.error("Failed to remove avatar:", e);
      }
    } else {
      if (browser) {
        localStorage.removeItem("temp_selfie");
        localStorage.removeItem("temp_landmarks");
      }
    }

    currentSelfieUrl = null;

    // If in a game, send avatar update
    if (get(gameState).screen !== "index") {
      gameClient.sendInput({
        type: "avatarUpdate",
        avatar: {
          eyes: 3,
          hair: 0,
          mouth: 0,
          emote: 0,
          selfieUrl: "",
        },
      });
    }

    toaster.success({
      title: "Avatar Removed",
      description: "You'll appear with a nametag only.",
    });
  }
</script>

<svelte:head>
  <title>Your Avatar - Couch Cup</title>
  <meta
    name="description"
    content="Preview or change your Couch Cup avatar selfie."
  />
</svelte:head>

<div class="avatar-page">
  <header class="app-bar">
    <Button variant="filled" onclick={() => goto("/")} id="back-to-home-btn">
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
    <h1 class="app-bar-title" id="avatar-page-title">Your Avatar</h1>
    <div class="app-bar-spacer"></div>
  </header>

  <main class="content-area">
    {#if loading}
      <div class="center-container">
        <Spinner />
      </div>
    {:else if mode === "preview"}
      <div class="preview-section">
        {#if currentSelfieUrl}
          <!-- Current Avatar Preview -->
          <div class="avatar-preview-card">
            <div class="avatar-image-container">
              <img
                src={currentSelfieUrl}
                alt="Your avatar"
                class="avatar-image"
              />
            </div>
            <div class="avatar-status">
              <Icon
                icon="material-symbols:check-circle-outline"
                style="font-size: 1.25rem; color: #4ade80;"
              />
              <span>Avatar Active</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="action-buttons">
            <button
              type="button"
              class="action-btn primary-action"
              onclick={() => (mode = "capture")}
            >
              <Icon
                icon="material-symbols:photo-camera-outline"
                style="font-size: 1.25rem;"
              />
              Change Avatar
            </button>
            <button
              type="button"
              class="action-btn danger-action"
              onclick={removeAvatar}
            >
              <Icon
                icon="material-symbols:delete-outline"
                style="font-size: 1.25rem;"
              />
              Remove Avatar
            </button>
          </div>
        {:else}
          <!-- No Avatar Placeholder -->
          <div class="no-avatar-card">
            <div class="no-avatar-icon">
              <Icon
                icon="material-symbols:person-outline"
                style="font-size: 4rem; color: #71717a;"
              />
            </div>
            <h2 class="no-avatar-title">No Avatar Set</h2>
            <p class="no-avatar-description">
              Take a selfie to create your 3D avatar, or play with a nametag
              only.
            </p>
          </div>

          <div class="action-buttons">
            <button
              type="button"
              class="action-btn primary-action"
              onclick={() => (mode = "capture")}
            >
              <Icon
                icon="material-symbols:photo-camera-outline"
                style="font-size: 1.25rem;"
              />
              Set Up Avatar
            </button>
          </div>
        {/if}
      </div>
    {:else if mode === "capture"}
      <div class="capture-section">
        <SelfieCapture
          onCapture={handleCapture}
          onSkip={() => (mode = "preview")}
          showSkip={false}
        />
        <button
          type="button"
          class="cancel-btn"
          onclick={() => (mode = "preview")}
        >
          Cancel
        </button>
      </div>
    {:else if mode === "uploading"}
      <div class="center-container">
        <Spinner />
        <span class="uploading-text">Processing selfie...</span>
      </div>
    {/if}
  </main>
</div>

<style>
  .avatar-page {
    background-color: var(--m3c-background);
    color: var(--m3c-on-background);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .app-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background-color: var(--m3c-surface-container);
    border-bottom: 1px solid var(--m3c-outline-variant);
  }

  .app-bar-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.2;
    font-weight: 500;
    color: var(--m3c-on-background);
    margin: 0;
  }

  .app-bar-spacer {
    flex: 1;
  }

  .content-area {
    max-width: 30rem;
    margin: 0 auto;
    width: 100%;
    padding: 2rem 1.5rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .center-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 1rem;
  }

  .uploading-text {
    color: var(--m3c-on-surface-variant);
    font-size: 1rem;
    font-weight: 500;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Preview Section */
  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    width: 100%;
    animation: fadeIn 300ms ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .avatar-preview-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .avatar-image-container {
    width: 14rem;
    height: 14rem;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--m3c-outline-variant);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
    background-color: var(--m3c-surface-container-low);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-status {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    background-color: var(--m3c-surface-container-high);
    color: var(--m3c-on-surface-variant);
    font-family: var(--m3-font);
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* No Avatar Placeholder */
  .no-avatar-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2.5rem 1.5rem;
    width: 100%;
    text-align: center;
  }

  .no-avatar-icon {
    width: 8rem;
    height: 8rem;
    border-radius: 50%;
    background-color: var(--m3c-surface-container-high);
    border: 3px dashed var(--m3c-outline-variant);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .no-avatar-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: var(--m3c-on-surface);
  }

  .no-avatar-description {
    font-family: var(--m3-font);
    font-size: 0.875rem;
    color: var(--m3c-on-surface-variant);
    margin: 0;
    max-width: 20rem;
    line-height: 1.5;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 20rem;
  }

  .action-btn {
    width: 100%;
    height: 3rem;
    border-radius: 0.75rem;
    font-family: var(--m3-font);
    font-size: 0.9375rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 200ms;
    border: none;
  }

  .action-btn:active {
    transform: scale(0.97);
  }

  .primary-action {
    background-color: var(--m3c-primary);
    color: var(--m3c-on-primary);
  }

  .primary-action:hover {
    opacity: 0.9;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .danger-action {
    background-color: transparent;
    color: var(--m3c-error);
    border: 1px solid var(--m3c-outline-variant);
  }

  .danger-action:hover {
    background-color: rgba(239, 68, 68, 0.08);
  }

  /* Capture Section */
  .capture-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .cancel-btn {
    background-color: transparent;
    color: var(--m3c-on-surface-variant);
    border: 1px solid var(--m3c-outline-variant);
    padding: 0.625rem 1.5rem;
    border-radius: 0.75rem;
    font-family: var(--m3-font);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms;
  }

  .cancel-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .cancel-btn:active {
    transform: scale(0.97);
  }
</style>
