<script lang="ts">
  import { browser } from "$app/environment";
  import { onDestroy } from "svelte";
  import Spinner from "$lib/components/spinner.svelte";
  import Iconify from "@iconify/svelte";

  export let onCapture: (blob: Blob) => void;
  export let onSkip: () => void;
  export let showSkip: boolean = true;

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
          height: { ideal: 640 },
        },
      });
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch((err) => {
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
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  function captureSelfie() {
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

      // Mirror the image horizontally
      ctx.translate(size, 0);
      ctx.scale(-1, 1);

      const sx = (width - size) / 2;
      const sy = (height - size) / 2;
      ctx.drawImage(videoElement, sx, sy, size, size, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob);
          } else {
            console.error("Failed to generate blob");
          }
        },
        "image/jpeg",
        0.9,
      );
    } catch (e: any) {
      console.error("Capture failed:", e);
    }
  }

  // Start camera on mount
  if (browser) {
    setTimeout(() => startCamera(), 50);
  }

  onDestroy(() => {
    stopCamera();
  });
</script>

<div class="selfie-capture">
  <div class="text-center">
    <h2 class="selfie-title">Create Custom Avatar! 📸</h2>
    <p class="selfie-subtitle">
      Align your face in the circle below to project onto your 3D avatar.
    </p>
  </div>

  <!-- Camera Viewport Container -->
  <div class="camera-viewport">
    {#if cameraLoading}
      <div class="camera-overlay">
        <Spinner />
        <span class="camera-status-text">Starting Camera...</span>
      </div>
    {/if}

    {#if cameraError}
      <div class="camera-overlay camera-error">
        <Iconify
          icon="material-symbols:videocam-off-outline"
          style="font-size: 2.5rem; color: #f87171;"
        />
        <p class="camera-error-text">{cameraError}</p>
        <button type="button" onclick={startCamera} class="retry-btn">
          Retry Camera
        </button>
      </div>
    {:else}
      <video
        bind:this={videoElement}
        autoplay
        playsinline
        muted
        class="camera-video"
      ></video>

      <!-- SVG Face Guide Overlay -->
      <svg viewBox="0 0 100 100" class="face-guide">
        <!-- Eye guide marks -->
        <circle cx="28" cy="45" r="2.2" fill="currentColor" opacity="0.6" />
        <circle cx="72" cy="45" r="2.2" fill="currentColor" opacity="0.6" />
        <!-- Mouth guide mark -->
        <path
          d="M 44,65 Q 50,68 56,65"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
          opacity="0.6"
        />
      </svg>
    {/if}
  </div>

  <div class="selfie-actions">
    {#if !cameraError}
      <!-- Capture Shutter Button -->
      <button
        type="button"
        onclick={captureSelfie}
        disabled={cameraLoading}
        class="shutter-btn"
      >
        <Iconify
          icon="material-symbols:photo-camera-outline"
          style="font-size: 1.5rem;"
        />
        Take Photo
      </button>
    {/if}

    {#if showSkip}
      <button type="button" onclick={onSkip} class="skip-btn">
        Skip — Use Nametag Only
      </button>
    {/if}
  </div>
</div>

<style>
  .selfie-capture {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    align-items: center;
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

  .text-center {
    text-align: center;
    max-width: 24rem;
  }

  .selfie-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 0.25rem 0;
  }

  .selfie-subtitle {
    color: #a1a1aa;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
  }

  .camera-viewport {
    position: relative;
    width: 16rem;
    height: 16rem;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(63, 63, 70, 0.8);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    background-color: #09090b;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .camera-viewport {
      width: 18rem;
      height: 18rem;
    }
  }

  .camera-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .face-guide {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    color: rgba(255, 255, 255, 0.4);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  .camera-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: #09090b;
    color: #a1a1aa;
  }

  .camera-status-text {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .camera-error {
    padding: 1rem;
    text-align: center;
    gap: 0.75rem;
  }

  .camera-error-text {
    font-size: 0.75rem;
    color: #a1a1aa;
    padding: 0 0.5rem;
    line-height: 1.3;
    margin: 0;
  }

  .retry-btn {
    padding: 0.5rem 1rem;
    background-color: #27272a;
    color: #ffffff;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 0.5rem;
    border: 1px solid #3f3f46;
    cursor: pointer;
    transition: all 200ms;
  }

  .retry-btn:hover {
    background-color: #3f3f46;
  }

  .retry-btn:active {
    transform: scale(0.95);
  }

  .selfie-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .shutter-btn {
    width: 100%;
    height: 3.5rem;
    background-color: #ffffff;
    color: #09090b;
    font-weight: 700;
    font-size: 1.125rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 4px solid #27272a;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 200ms;
  }

  .shutter-btn:hover {
    background-color: #f4f4f5;
  }

  .shutter-btn:active {
    transform: scale(0.95);
  }

  .shutter-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .skip-btn {
    width: 100%;
    height: 3rem;
    background-color: transparent;
    color: #a1a1aa;
    font-weight: 600;
    font-size: 0.875rem;
    border-radius: 0.75rem;
    border: 1px solid #3f3f46;
    cursor: pointer;
    transition: all 200ms;
  }

  .skip-btn:hover {
    background-color: rgba(63, 63, 70, 0.3);
    color: #d4d4d8;
  }

  .skip-btn:active {
    transform: scale(0.97);
  }
</style>
