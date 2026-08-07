<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Icon from "@iconify/svelte";
  import { authClient } from "../../stores/authStore";
  import { dbClient } from "../../stores/apiClient";
  import { apiClient } from "$lib/backend/axios";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { get } from "svelte/store";

  const session = authClient.useSession();
  const MAX_DURATION_SEC = 2.0;
  const MAX_DURATION_MS = 2000;

  let isRecording = $state(false);
  let isUploading = $state(false);
  let isPlayingPreview = $state(false);
  let recordingProgress = $state(0);
  let currentTimeSec = $state(0.0);
  let currentCatchphraseUrl = $state<string | null>(null);
  let audioBlob = $state<Blob | null>(null);
  let audioPreviewUrl = $state<string | null>(null);
  let statusMessage = $state<string | null>(null);

  // Waveform canvas element
  let canvasRef = $state<HTMLCanvasElement | null>(null);
  let waveformData = $state<number[]>(new Array(100).fill(0.05));

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordTimer: NodeJS.Timeout | null = null;
  let progressInterval: NodeJS.Timeout | null = null;
  let previewAudio: HTMLAudioElement | null = null;

  // Web Audio API context for visualization & waveform sampling
  let audioCtx: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let animFrameId: number | null = null;
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

    drawWaveformCanvas();

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
    analyserNode.fftSize = 128;
    analyserNode.smoothingTimeConstant = 0.6;
    sourceNode.connect(analyserNode);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateFrame = () => {
      if (!analyserNode) return;
      analyserNode.getByteTimeDomainData(dataArray);

      // Compute RMS amplitude volume level (0.0 to 1.0)
      let sumSq = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (dataArray[i] - 128) / 128;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / bufferLength);
      const normalizedAmp = Math.max(0.05, Math.min(1.0, rms * 2.8));

      // Append amplitude sample to current position on timeline
      if (isRecording) {
        const elapsedSec = (Date.now() - startTimeMs) / 1000;
        currentTimeSec = Math.min(MAX_DURATION_SEC, elapsedSec);
        const index = Math.floor((currentTimeSec / MAX_DURATION_SEC) * (waveformData.length - 1));
        const updated = [...waveformData];
        updated[index] = Math.max(updated[index] || 0, normalizedAmp);
        waveformData = updated;
      }

      drawWaveformCanvas();
      animFrameId = requestAnimationFrame(updateFrame);
    };

    updateFrame();
  }

  function stopVisualization() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    analyserNode = null;
  }

  function drawWaveformCanvas() {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const width = canvasRef.width;
    const height = canvasRef.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Canvas background
    ctx.fillStyle = "#0f172a"; // dark slate-900
    ctx.fillRect(0, 0, width, height);

    // Draw Grid & Time Markers (0.0s, 0.5s, 1.0s, 1.5s, 2.0s)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";

    const numGridLines = 4;
    for (let i = 0; i <= numGridLines; i++) {
      const x = (i / numGridLines) * width;
      const timeVal = (i * 0.5).toFixed(1) + "s";
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(timeVal, Math.max(12, Math.min(width - 12, x)), height - 4);
    }

    // Draw Mirrored Waveform Bars
    const barWidth = width / waveformData.length;
    const centerY = height / 2 - 4;
    const playheadX = (currentTimeSec / MAX_DURATION_SEC) * width;

    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barWidth;
      const amp = waveformData[i];
      const barHeight = Math.max(3, amp * (height / 2 - 10));

      const isRecordedPortion = x <= playheadX;
      if (isRecording) {
        ctx.fillStyle = isRecordedPortion ? "#f43f5e" : "rgba(244, 63, 94, 0.25)"; // rose-500
      } else if (isPlayingPreview) {
        ctx.fillStyle = isRecordedPortion ? "#38bdf8" : "rgba(56, 189, 248, 0.25)"; // sky-400
      } else {
        ctx.fillStyle = isRecordedPortion ? "#34d399" : "rgba(255, 255, 255, 0.2)"; // emerald-400
      }

      ctx.fillRect(x, centerY - barHeight, Math.max(1, barWidth - 0.5), barHeight * 2);
    }

    // Draw Track Head (Playhead Cursor Line)
    if (isRecording || isPlayingPreview || currentTimeSec > 0) {
      ctx.strokeStyle = isRecording ? "#ff0055" : isPlayingPreview ? "#00f0ff" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      ctx.shadowBlur = 0; // reset shadow

      // Draw Playhead Top Handle Cap
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(playheadX, 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  async function handlePressStart(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (isRecording || isUploading) return;
    statusMessage = null;
    cleanupAll();
    audioChunks = [];
    recordingProgress = 0;
    currentTimeSec = 0.0;
    waveformData = new Array(100).fill(0.05);

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
      startTimeMs = Date.now();
      mediaRecorder.start(100);

      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTimeMs;
        recordingProgress = Math.min(100, (elapsed / MAX_DURATION_MS) * 100);
        currentTimeSec = Math.min(MAX_DURATION_SEC, elapsed / 1000);
      }, 25);

      // Auto stop after 2.0 seconds max
      recordTimer = setTimeout(() => {
        finishRecording();
      }, MAX_DURATION_MS);
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
    currentTimeSec = 0.0;

    // Connect preview audio to visualizer
    if (audioCtx) {
      try {
        const sourceNode = audioCtx.createMediaElementSource(previewAudio);
        startVisualization(sourceNode);
        analyserNode?.connect(audioCtx.destination);
      } catch (err) {
        // Fallback for CORS or existing node connection
      }
    }

    previewAudio.ontimeupdate = () => {
      if (previewAudio) {
        currentTimeSec = Math.min(MAX_DURATION_SEC, previewAudio.currentTime);
      }
    };

    previewAudio.onended = () => {
      isPlayingPreview = false;
      currentTimeSec = MAX_DURATION_SEC;
      stopVisualization();
      drawWaveformCanvas();
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
    currentTimeSec = 0.0;
    waveformData = new Array(100).fill(0.05);
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
    drawWaveformCanvas();
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
      <span class="text-base font-bold">2s Catchphrase</span>
    </div>
    {#if currentCatchphraseUrl || audioPreviewUrl}
      <span class="badge badge-success text-xs font-semibold">Recorded</span>
    {:else}
      <span class="badge badge-ghost text-xs font-semibold">Optional</span>
    {/if}
  </div>

  <!-- Real-time Waveform Display Canvas with Track Head & Duration -->
  <div class="w-full bg-slate-900 rounded-xl p-2 flex flex-col gap-1 items-center justify-center border border-base-300 relative overflow-hidden">
    <canvas
      bind:this={canvasRef}
      width="340"
      height="64"
      class="w-full h-16 rounded-lg block"
    ></canvas>

    <div class="w-full flex justify-between items-center px-1 text-[11px] font-mono font-bold text-slate-300">
      <span class="flex items-center gap-1">
        {#if isRecording}
          <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span class="text-red-400">REC</span>
        {:else if isPlayingPreview}
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span class="text-cyan-400">PLAY</span>
        {:else}
          <span class="text-slate-400">TRACK</span>
        {/if}
      </span>
      <span class="tracking-wider">
        {currentTimeSec.toFixed(1)}s / {MAX_DURATION_SEC.toFixed(1)}s
      </span>
    </div>
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
          Release to Finish (2s max)
        {:else if currentCatchphraseUrl}
          Hold to Re-record
        {:else}
          Hold to Record (2s)
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
