<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Icon from "@iconify/svelte";
  import { authClient } from "../../stores/authStore";
  import { dbClient } from "../../stores/apiClient";
  import { apiClient } from "$lib/backend/axios";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";
  import { playerEmote } from "$lib/avatar/player_emote";

  const session = authClient.useSession();
  const MAX_DURATION_SEC = 2.0;
  const MAX_DURATION_MS = 2000;

  let isRecording = $state(false);
  let isUploading = $state(false);
  let currentTimeSec = $state(0.0);
  let currentCatchphraseUrl = $state<string | null>(null);
  let audioBlob = $state<Blob | null>(null);
  let audioPreviewUrl = $state<string | null>(null);
  let statusMessage = $state<string | null>(null);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordTimer: NodeJS.Timeout | null = null;
  let progressInterval: NodeJS.Timeout | null = null;
  let activeStream: MediaStream | null = null;
  let startTimeMs = 0;

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
        const catchphrase = (me as any)?.avatar_catchphrase;
        if (catchphrase) {
          currentCatchphraseUrl = catchphrase;
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
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
      } catch (e) {}
    }
  }

  /**
   * Trims silence from the beginning and end of an audio blob using Web Audio API PCM sampling.
   */
  async function trimSilenceFromAudioBlob(
    blob: Blob,
    threshold = 0.015,
  ): Promise<Blob> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const tempCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const decodedBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      const sampleRate = decodedBuffer.sampleRate;
      const numberOfChannels = decodedBuffer.numberOfChannels;
      const channelData = decodedBuffer.getChannelData(0);
      const length = channelData.length;

      let startSample = 0;
      let endSample = length - 1;

      // Find first sample exceeding silence threshold
      for (let i = 0; i < length; i++) {
        if (Math.abs(channelData[i]) > threshold) {
          startSample = Math.max(0, i - Math.floor(sampleRate * 0.025)); // 25ms padding
          break;
        }
      }

      // Find last sample exceeding silence threshold
      for (let i = length - 1; i >= startSample; i--) {
        if (Math.abs(channelData[i]) > threshold) {
          endSample = Math.min(length - 1, i + Math.floor(sampleRate * 0.025)); // 25ms padding
          break;
        }
      }

      const trimmedLength = endSample - startSample + 1;
      if (trimmedLength <= 0 || trimmedLength >= length) {
        tempCtx.close();
        return blob;
      }

      const trimmedBuffer = new AudioBuffer({
        numberOfChannels,
        length: trimmedLength,
        sampleRate,
      });

      for (let c = 0; c < numberOfChannels; c++) {
        const srcChannel = decodedBuffer.getChannelData(c);
        const destChannel = trimmedBuffer.getChannelData(c);
        for (let i = 0; i < trimmedLength; i++) {
          destChannel[i] = srcChannel[startSample + i];
        }
      }

      const wavBlob = audioBufferToWavBlob(trimmedBuffer);
      tempCtx.close();
      return wavBlob;
    } catch (err) {
      console.warn("Failed to trim silence, returning original blob:", err);
      return blob;
    }
  }

  /**
   * Encodes an AudioBuffer into an uncompressed 16-bit PCM WAV Blob.
   */
  function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // fmt subchunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * numOfChan * 2);
    setUint16(numOfChan * 2);
    setUint16(16);

    // data subchunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < buffer.length; i++) {
      for (let c = 0; c < numOfChan; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        out.setInt16(pos, Math.round(sample), true);
        pos += 2;
      }
    }

    return new Blob([out.buffer], { type: "audio/wav" });
  }

  async function handlePressStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isRecording || isUploading) return;
    statusMessage = null;
    cleanupAll();
    audioChunks = [];
    currentTimeSec = 0.0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStream = stream;

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
        else if (MediaRecorder.isTypeSupported("audio/ogg"))
          mimeType = "audio/ogg";
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
        if (activeStream) {
          activeStream.getTracks().forEach((track) => track.stop());
          activeStream = null;
        }

        const rawBlobType = mediaRecorder?.mimeType || "audio/webm";
        const rawBlob = new Blob(audioChunks, { type: rawBlobType });

        // Trim silence at start & end
        statusMessage = "Trimming...";
        const trimmedWavBlob = await trimSilenceFromAudioBlob(rawBlob);
        audioBlob = trimmedWavBlob;
        audioPreviewUrl = URL.createObjectURL(trimmedWavBlob);
        isRecording = false;

        await uploadCatchphrase();
      };

      isRecording = true;
      startTimeMs = Date.now();
      mediaRecorder.start(100);

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTimeMs;
        currentTimeSec = Math.min(MAX_DURATION_SEC, elapsed / 1000);
      }, 50);

      // Auto stop after 2.0 seconds max
      recordTimer = setTimeout(() => {
        finishRecording();
      }, MAX_DURATION_MS);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      isRecording = false;
      statusMessage = "Mic access denied.";
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
      statusMessage = "Audio too short.";
      return;
    }

    isUploading = true;
    statusMessage = "Saving...";

    try {
      const formData = new FormData();
      const ext = audioBlob.type.includes("wav")
        ? "wav"
        : audioBlob.type.includes("mp4")
          ? "m4a"
          : "webm";
      formData.append("file", audioBlob, `catchphrase.${ext}`);

      const res = await fetch(
        `${import.meta.env.VITE_PUBLIC_API_URL}/upload/audio`,
        {
          method: "POST",
          body: formData,
        },
      );

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
              avatar_selfie: me.avatar_selfie ?? undefined,
              avatar_gender: me.avatar_gender ?? undefined,
              avatar_catchphrase: url,
            } as any);
          }
        } catch (dbErr) {
          console.error(
            "Failed to update user avatar profile with catchphrase:",
            dbErr,
          );
        }
      }

      syncAvatarWithHost(url);
      statusMessage = null;
    } catch (err: any) {
      console.error("Error uploading catchphrase:", err);
      statusMessage = "Upload failed.";
    } finally {
      isUploading = false;
    }
  }

  function syncAvatarWithHost(catchphraseUrl: string | null) {
    const currentAvatar = get(gameState).avatar || {
      selfieUrl: "",
    };

    const updatedAvatar = {
      ...currentAvatar,
      catchphraseUrl: catchphraseUrl || undefined,
    };

    gameClient.sendPlayerInput("avatarUpdate", { avatar: updatedAvatar });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="w-full bg-base-300 border border-base-300 rounded-xl px-3 py-3 select-none flex items-center justify-between gap-2"
  onclick={(e) => e.stopPropagation()}
>
  <!-- Left: Title & Status -->
  <div class="flex items-center gap-1.5 min-w-0">
    <Icon
      icon={isRecording ? "mdi:record-rec" : "mdi:microphone"}
      class="text-2xl shrink-0 {isRecording
        ? 'text-error animate-pulse'
        : 'text-primary'}"
    />
    <div class="flex flex-col min-w-0">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-md font-bold truncate">Catchphrase</span>
        {#if isRecording}
          <span
            class="badge badge-error badge-xs font-semibold animate-pulse font-mono"
          >
            {currentTimeSec.toFixed(1)}s / 2.0s
          </span>
        {:else if isUploading}
          <span class="badge badge-warning badge-xs font-semibold"
            >Saving...</span
          >
        {/if}
      </div>
      {#if statusMessage && !isRecording}
        <span class="text-[10px] text-warning truncate">{statusMessage}</span>
      {/if}
    </div>
  </div>

  <!-- Right: Controls -->
  <div class="flex items-center gap-1.5 shrink-0">
    {#if (currentCatchphraseUrl || audioPreviewUrl) && !isRecording}
      <!-- Play Emote Preview -->
      <button
        type="button"
        class="btn btn-md btn-outline btn-info gap-1"
        onclick={() => playerEmote()}
        title="Play emote"
      >
        <Icon icon="mdi:play" class="text-sm" />
        <span>Play</span>
      </button>
    {/if}

    <!-- Record / Re-record Button -->
    <button
      type="button"
      class="btn btn-secondary btn-md gap-1 touch-none select-none font-bold transition-transform active:scale-95"
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
        class="text-base {isRecording ? 'animate-pulse' : ''}"
      />
      <span>
        {#if isRecording}
          Release to Stop
        {:else if currentCatchphraseUrl || audioPreviewUrl}
          Re-record
        {:else}
          Hold to Record 🎙️
        {/if}
      </span>
    </button>
  </div>
</div>
