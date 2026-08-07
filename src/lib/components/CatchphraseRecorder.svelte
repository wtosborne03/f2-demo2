<script lang="ts">
  import { onMount, onDestroy } from "svelte";
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

  // Audio visualization bars (14 frequency bands)
  let visualizerBars = $state<number[]>(new Array(14).fill(15));

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordTimer: NodeJS.Timeout | null = null;
  let progressInterval: NodeJS.Timeout | null = null;
  let previewAudio: HTMLAudioElement | null = null;

  // Web Audio API context for visualization
  let audioCtx: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let animFrameId: number | null = null;
  let activeStream: MediaStream | null = null;

  onMount(() => {
    const localCatchphrase = localStorage.getItem("temp_catchphrase");
    if (localCatchphrase) {
      currentCatchphraseUrl = localCatchphrase;
    }

    if ($session.data?.user) {
      fetchUserCatchphrase();
    }

    return () => {
      cleanupAll();
    };
  });

  onDestroy(() => {
    cleanupAll();
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

  function cleanupAll() {
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    stopVisualization();
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
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

  function setupAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function startVisualization(sourceNode: AudioNode) {
    if (!audioCtx) return;
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 64;
    analyserNode.smoothingTimeConstant = 0.7;
    sourceNode.connect(analyserNode);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateBars = () => {
      if (!analyserNode) return;
      analyserNode.getByteFrequencyData(dataArray);

      const newBars: number[] = [];
      const step = Math.floor(bufferLength / 14) || 1;

      for (let i = 0; i < 14; i++) {
        const val = dataArray[i * step] || 0;
        // Normalize between 15% and 100%
        const normalized = Math.max(15, Math.min(100, (val / 255) * 100));
        newBars.push(normalized);
      }

      visualizerBars = newBars;
      animFrameId = requestAnimationFrame(updateBars);
    };

    updateBars();
  }

  function stopVisualization() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    analyserNode = null;
    visualizerBars = new Array(14).fill(15);
  }

  async function handlePressStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isRecording || isUploading) return;
    statusMessage = null;
    cleanupAll();
    audioChunks = [];
    recordingProgress = 0;

    try {
      setupAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStream = stream;

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
        stopVisualization();
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          activeStream = null;
        }

        const blobType = mediaRecorder?.mimeType || "audio/webm";
        audioBlob = new Blob(audioChunks, { type: blobType });
        audioPreviewUrl = URL.createObjectURL(audioBlob);
        isRecording = false;
        recordingProgress = 100;
        await uploadCatchphrase();
      };

      // Connect microphone stream to visualizer
      if (audioCtx) {
        const streamSource = audioCtx.createMediaStreamSource(stream);
        startVisualization(streamSource);
      }

      isRecording = true;
      mediaRecorder.start(100);

      const startTime = Date.now();
      const MAX_RECORD_DURATION_MS = 1000; // 1 second max

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        recordingProgress = Math.min(100, (elapsed / MAX_RECORD_DURATION_MS) * 100);
      }, 25);

      // Auto stop after 1.0 second max
      recordTimer = setTimeout(() => {
        finishRecording();
      }, MAX_RECORD_DURATION_MS);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      isRecording = false;
      statusMessage = "Microphone access denied or unavailable.";
    }
  }

  function handlePressEnd(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isRecording) {
      finishRecording();
    }
  }

  function finishRecording() {
    if (recordTimer) {
      clearTimeout(recordTimer);
      recordTimer = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.stop();
      } catch (e) {}
    }
  }

  async function uploadCatchphrase() {
    if (!audioBlob || audioBlob.size < 500) {
      statusMessage = "Audio too short. Hold button longer to record.";
      return;
    }

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
      stopVisualization();
      return;
    }

    if (previewAudio) {
      previewAudio.pause();
    }

    setupAudioContext();
    previewAudio = new Audio(soundUrl);
    previewAudio.crossOrigin = "anonymous";
    isPlayingPreview = true;

    // Connect preview audio to visualizer if Web Audio API available
    if (audioCtx) {
      try {
        const sourceNode = audioCtx.createMediaElementSource(previewAudio);
        startVisualization(sourceNode);
        analyserNode?.connect(audioCtx.destination);
      } catch (err) {
        // Fallback for CORS or repeated element connection
      }
    }

    previewAudio.onended = () => {
      isPlayingPreview = false;
      stopVisualization();
    };
    previewAudio.onerror = () => {
      isPlayingPreview = false;
      stopVisualization();
      statusMessage = "Unable to play audio preview.";
    };
    previewAudio.play().catch(() => {
      isPlayingPreview = false;
      stopVisualization();
    });
  }

  async function deleteCatchphrase(e: MouseEvent) {
    e.stopPropagation();
    statusMessage = null;
    cleanupAll();
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
  class="card bg-base-200 border border-base-300 shadow-sm p-4 w-full flex flex-col gap-3 my-4 select-none"
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

  <!-- Real-time Equalizer Audio Visualization Preview -->
  <div class="w-full bg-base-300/80 rounded-xl p-3 flex flex-col gap-2 items-center justify-center border border-base-300">
    <div class="flex items-end justify-center gap-1.5 h-10 w-full px-2">
      {#each visualizerBars as barHeight, i}
        <div
          class="w-2.5 rounded-full transition-all duration-75"
          class:bg-error={isRecording}
          class:bg-primary={isPlayingPreview}
          class:bg-base-content={!isRecording && !isPlayingPreview}
          style="height: {barHeight}%; opacity: {isRecording || isPlayingPreview ? 0.9 : 0.35};"
        ></div>
      {/each}
    </div>

    {#if isRecording}
      <div class="w-full bg-base-100/50 rounded-full h-1.5 overflow-hidden mt-1">
        <div
          class="bg-error h-1.5 transition-all duration-75"
          style="width: {recordingProgress}%"
        ></div>
      </div>
    {/if}
  </div>

  <!-- Hold to Record Action Controls -->
  <div class="flex flex-wrap gap-2 items-center">
    <button
      type="button"
      class="btn btn-primary flex-1 flex items-center justify-center gap-2 touch-none select-none py-3 font-bold transition-transform active:scale-95"
      class:btn-error={isRecording}
      disabled={isUploading}
      onmousedown={handlePressStart}
      onmouseup={handlePressEnd}
      onmouseleave={handlePressEnd}
      ontouchstart={handlePressStart}
      ontouchend={handlePressEnd}
      ontouchcancel={handlePressEnd}
    >
      <Icon
        icon={isRecording ? "mdi:record-rec" : "mdi:microphone"}
        class="text-xl {isRecording ? 'animate-ping' : ''}"
      />
      <span>
        {#if isRecording}
          Release to Finish (1s max)
        {:else if currentCatchphraseUrl}
          Hold to Re-record
        {:else}
          Hold to Record (1s)
        {/if}
      </span>
    </button>

    {#if currentCatchphraseUrl || audioPreviewUrl}
      <button
        type="button"
        class="btn btn-outline flex items-center justify-center gap-1"
        onclick={togglePreview}
        title="Play preview"
      >
        <Icon icon={isPlayingPreview ? "mdi:pause" : "mdi:play"} class="text-lg" />
        <span>{isPlayingPreview ? "Stop" : "Test"}</span>
      </button>

      <button
        type="button"
        class="btn btn-ghost btn-square text-error"
        onclick={deleteCatchphrase}
        title="Remove catchphrase"
      >
        <Icon icon="mdi:trash-can-outline" class="text-lg" />
      </button>
    {/if}
  </div>

  {#if isUploading}
    <div class="flex items-center gap-2 text-xs text-primary font-medium mt-1">
      <span class="loading loading-spinner loading-xs"></span>
      <span>Saving audio to server...</span>
    </div>
  {:else if statusMessage}
    <div class="text-xs text-base-content/70 italic font-medium mt-1">{statusMessage}</div>
  {/if}
</div>
