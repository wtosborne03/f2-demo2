<script lang="ts">
  import { onMount } from "svelte";
  import Icon from "@iconify/svelte";
  import { authClient } from "../../stores/authStore";
  import { dbClient } from "../../stores/apiClient";
  import { apiClient } from "$lib/backend/axios";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";

  const session = authClient.useSession();

  let isRecording = $state(false);
  let isUploading = $state(false);
  let isPlayingPreview = $state(false);
  let recordingProgress = $state(0);
  let currentCatchphraseUrl = $state<string | null>(null);
  let audioBlob = $state<Blob | null>(null);
  let audioPreviewUrl = $state<string | null>(null);
  let statusMessage = $state<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordingInterval: NodeJS.Timeout | null = null;
  let previewAudio: HTMLAudioElement | null = null;

  onMount(() => {
    // Load existing catchphrase from user profile or local storage
    const localCatchphrase = localStorage.getItem("temp_catchphrase");
    if (localCatchphrase) {
      currentCatchphraseUrl = localCatchphrase;
    }

    // Try fetching user catchphrase if authenticated
    if ($session.data?.user) {
      fetchUserCatchphrase();
    }

    return () => {
      cleanupMedia();
    };
  });

  async function fetchUserCatchphrase() {
    try {
      let client = get(dbClient);
      if (!client) {
        client = await apiClient;
        if (client) dbClient.set(client);
      }
      if (client) {
        const { data: me } = await client.getUsersMe();
        if (me.avatar_catchphrase) {
          currentCatchphraseUrl = me.avatar_catchphrase;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch user catchphrase:", e);
    }
  }

  function cleanupMedia() {
    if (recordingInterval) {
      clearInterval(recordingInterval);
      recordingInterval = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch (e) {}
    }
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    }
  }

  async function startRecording(e: MouseEvent) {
    e.stopPropagation();
    statusMessage = null;
    cleanupMedia();
    audioChunks = [];
    recordingProgress = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";
        else mimeType = "";
      }

      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blobType = mediaRecorder?.mimeType || "audio/webm";
        audioBlob = new Blob(audioChunks, { type: blobType });
        audioPreviewUrl = URL.createObjectURL(audioBlob);
        isRecording = false;
        recordingProgress = 100;
        await uploadCatchphrase();
      };

      isRecording = true;
      mediaRecorder.start(100);

      const startTime = Date.now();
      const RECORD_DURATION_MS = 1000;

      recordingInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        recordingProgress = Math.min(100, (elapsed / RECORD_DURATION_MS) * 100);
        if (elapsed >= RECORD_DURATION_MS) {
          if (recordingInterval) clearInterval(recordingInterval);
          recordingInterval = null;
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }
      }, 30);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      isRecording = false;
      statusMessage = "Microphone access denied or unavailable.";
    }
  }

  async function uploadCatchphrase() {
    if (!audioBlob) return;
    isUploading = true;
    statusMessage = "Uploading catchphrase...";

    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes("mp4") ? "m4a" : audioBlob.type.includes("wav") ? "wav" : "webm";
      formData.append("file", audioBlob, `catchphrase.${ext}`);

      const res = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/upload/audio`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      const url = data.url;

      currentCatchphraseUrl = url;
      localStorage.setItem("temp_catchphrase", url);

      // If user is logged in, update avatar profile in database
      if ($session.data?.user) {
        try {
          let client = get(dbClient);
          if (!client) {
            client = await apiClient;
            if (client) dbClient.set(client);
          }
          if (client) {
            const { data: me } = await client.getUsersMe();
            await client.putUsersAvatar(null, {
              avatar_emote: me.avatar_emote ?? 0,
              avatar_eyes: me.avatar_eyes ?? undefined,
              avatar_hair: me.avatar_hair ?? undefined,
              avatar_mouth: me.avatar_mouth ?? undefined,
              avatar_selfie: me.avatar_selfie ?? undefined,
              avatar_gender: me.avatar_gender ?? undefined,
              avatar_catchphrase: url,
            });
          }
        } catch (dbErr) {
          console.error("Failed to update user avatar profile with catchphrase:", dbErr);
        }
      }

      // Sync updated avatar with host via WS
      syncAvatarWithHost(url);

      statusMessage = "Catchphrase saved! 🎤";
    } catch (err: any) {
      console.error("Error uploading catchphrase:", err);
      statusMessage = "Failed to upload audio.";
    } finally {
      isUploading = false;
    }
  }

  function syncAvatarWithHost(catchphraseUrl: string | null) {
    const currentAvatar = get(gameState).avatar || {
      eyes: 3,
      mouth: 0,
      hair: 0,
      emote: 0,
      selfieUrl: "",
    };

    const updatedAvatar = {
      ...currentAvatar,
      catchphraseUrl: catchphraseUrl || undefined,
    };

    gameClient.sendPlayerInput("avatarUpdate", { avatar: updatedAvatar });
  }

  function togglePreview(e: MouseEvent) {
    e.stopPropagation();
    const soundUrl = audioPreviewUrl || currentCatchphraseUrl;
    if (!soundUrl) return;

    if (isPlayingPreview && previewAudio) {
      previewAudio.pause();
      isPlayingPreview = false;
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
    }

    previewAudio = new Audio(soundUrl);
    isPlayingPreview = true;
    previewAudio.onended = () => {
      isPlayingPreview = false;
    };
    previewAudio.onerror = () => {
      isPlayingPreview = false;
      statusMessage = "Unable to play audio.";
    };
    previewAudio.play().catch(() => {
      isPlayingPreview = false;
    });
  }

  async function deleteCatchphrase(e: MouseEvent) {
    e.stopPropagation();
    statusMessage = null;
    cleanupMedia();
    currentCatchphraseUrl = null;
    audioBlob = null;
    audioPreviewUrl = null;
    localStorage.removeItem("temp_catchphrase");

    if ($session.data?.user) {
      try {
        let client = get(dbClient);
        if (!client) {
          client = await apiClient;
          if (client) dbClient.set(client);
        }
        if (client) {
          const { data: me } = await client.getUsersMe();
          await client.putUsersAvatar(null, {
            avatar_emote: me.avatar_emote ?? 0,
            avatar_eyes: me.avatar_eyes ?? undefined,
            avatar_hair: me.avatar_hair ?? undefined,
            avatar_mouth: me.avatar_mouth ?? undefined,
            avatar_selfie: me.avatar_selfie ?? undefined,
            avatar_gender: me.avatar_gender ?? undefined,
            avatar_catchphrase: null,
          });
        }
      } catch (err) {
        console.error("Failed to delete user catchphrase from profile:", err);
      }
    }

    syncAvatarWithHost(null);
    statusMessage = "Catchphrase removed.";
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="card bg-base-200 border border-base-300 shadow-sm p-4 w-full flex flex-col gap-3 my-4"
  onclick={(e) => e.stopPropagation()}
>
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-2">
      <Icon icon="mdi:microphone" class="text-xl text-primary" />
      <span class="text-base font-bold">1s Catchphrase</span>
    </div>
    {#if currentCatchphraseUrl || audioPreviewUrl}
      <span class="badge badge-success text-xs font-semibold">Recorded</span>
    {:else}
      <span class="badge badge-ghost text-xs font-semibold">Optional</span>
    {/if}
  </div>

  {#if isRecording}
    <div class="flex flex-col gap-2 py-2">
      <div class="flex items-center justify-between text-xs font-bold text-error animate-pulse">
        <span>Recording... (1s)</span>
        <span>{Math.round(recordingProgress)}%</span>
      </div>
      <div class="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
        <div
          class="bg-error h-2.5 transition-all duration-75"
          style="width: {recordingProgress}%"
        ></div>
      </div>
    </div>
  {:else}
    <div class="flex flex-wrap gap-2 items-center">
      <button
        type="button"
        class="btn btn-sm btn-primary flex-1 flex items-center justify-center gap-1"
        disabled={isUploading}
        onclick={startRecording}
      >
        <Icon icon="mdi:record-circle" class="text-base text-red-400" />
        <span>{currentCatchphraseUrl ? "Re-record (1s)" : "Record Catchphrase (1s)"}</span>
      </button>

      {#if currentCatchphraseUrl || audioPreviewUrl}
        <button
          type="button"
          class="btn btn-sm btn-outline flex items-center justify-center"
          onclick={togglePreview}
          title="Play preview"
        >
          <Icon icon={isPlayingPreview ? "mdi:pause" : "mdi:play"} class="text-base" />
          <span>{isPlayingPreview ? "Stop" : "Test"}</span>
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost btn-square text-error"
          onclick={deleteCatchphrase}
          title="Remove catchphrase"
        >
          <Icon icon="mdi:trash-can-outline" class="text-base" />
        </button>
      {/if}
    </div>
  {/if}

  {#if isUploading}
    <div class="flex items-center gap-2 text-xs text-primary font-medium">
      <span class="loading loading-spinner loading-xs"></span>
      <span>Saving audio to server...</span>
    </div>
  {:else if statusMessage}
    <div class="text-xs text-base-content/70 italic font-medium">{statusMessage}</div>
  {/if}
</div>
