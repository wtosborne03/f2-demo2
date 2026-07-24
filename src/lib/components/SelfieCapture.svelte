<script lang="ts">
  import { browser } from "$app/environment";
  import { onDestroy } from "svelte";
  import Iconify from "@iconify/svelte";
  import Compressor from "compressorjs";
  import { apiClient } from "$lib/backend/axios";
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { authClient } from "../../stores/authStore";
  import { toaster } from "$lib/util/toaster";
  import { slide } from "svelte/transition";
  import type { SelfieAvatar } from "../../types/selfie_avatar";
  import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

  export let initialMode: "auto" | "camera" = "auto";
  export let onUploadComplete: ((result: SelfieAvatar) => void) | undefined =
    undefined;
  export let onSkip: (() => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;
  export let onAvatarRemoved: (() => void) | undefined = undefined;

  const session = authClient.useSession();

  let videoElement: HTMLVideoElement;
  let stream: MediaStream | null = null;
  let cameraLoading = false;
  let cameraError: string | null = null;

  let faceDetector: FaceDetector | null = null;
  let isFaceAligned = false;
  let alignmentFeedback:
    | "none"
    | "too-far"
    | "too-close"
    | "not-centered"
    | "aligned" = "none";
  let faceBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;
  let animationFrameId: number;

  let mode:
    | "loading"
    | "preview"
    | "no-avatar"
    | "camera"
    | "uploading"
    | "error" = initialMode === "camera" ? "camera" : "loading";

  let currentSelfieUrl: string | null = null;
  let loadingAvatar = initialMode === "camera" ? false : true;

  let uploadError: string | null = null;
  let userFriendlyErrorMsg: string = "";
  let uploadingProgress: string = "";
  let capturedBlob: Blob | null = null;
  let isCapturing = false;

  $: if (initialMode === "auto" && !$session.isPending) {
    loadCurrentAvatar();
  }

  async function loadCurrentAvatar() {
    loadingAvatar = true;
    const user = get(session).data?.user;
    if (user) {
      try {
        const client = await apiClient;
        if (client) {
          const { data: me } = await client.getUsersMe();
          currentSelfieUrl = me.avatar_selfie || null;
        }
      } catch (e) {
        console.error(
          "Failed to load avatar from backend, falling back to localStorage:",
          e,
        );
        if (browser) {
          currentSelfieUrl = localStorage.getItem("temp_selfie") || null;
        }
      }
    } else {
      if (browser) {
        currentSelfieUrl = localStorage.getItem("temp_selfie") || null;
      }
    }
    loadingAvatar = false;
    if (currentSelfieUrl) {
      mode = "preview";
    } else {
      mode = "no-avatar";
    }
  }

  async function saveAvatar(
    selfieUrl: string,
    expressions?: any,
    gender?: string,
  ) {
    const user = get(session).data?.user;
    if (user) {
      try {
        const client = await apiClient;
        await client!.putUsersAvatar(null, {
          avatar_emote: 0,
          avatar_eyes: 3,
          avatar_hair: 0,
          avatar_mouth: 0,
          avatar_selfie: selfieUrl,
          avatar_neutral_open: expressions?.neutral_open || null,
          avatar_neutral_closed: expressions?.neutral_closed || null,
          avatar_happy_open: expressions?.happy_open || null,
          avatar_happy_closed: expressions?.happy_closed || null,
          avatar_sad_open: expressions?.sad_open || null,
          avatar_sad_closed: expressions?.sad_closed || null,
          avatar_surprised_open: expressions?.surprised_open || null,
          avatar_surprised_closed: expressions?.surprised_closed || null,
          avatar_gender: gender || null,
        });
      } catch (e) {
        console.error("Failed to save avatar to backend:", e);
      }
    }

    // Always mirror to localStorage as local fallback
    if (browser) {
      localStorage.setItem("temp_selfie", selfieUrl);
      if (expressions) {
        localStorage.setItem("temp_expressions", JSON.stringify(expressions));
      } else {
        localStorage.removeItem("temp_expressions");
      }
      if (gender) {
        localStorage.setItem("temp_gender", gender);
      } else {
        localStorage.removeItem("temp_gender");
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
          expressions,
          gender,
        },
      });
    }
  }

  async function deleteAvatar() {
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
          avatar_neutral_open: null,
          avatar_neutral_closed: null,
          avatar_happy_open: null,
          avatar_happy_closed: null,
          avatar_sad_open: null,
          avatar_sad_closed: null,
          avatar_surprised_open: null,
          avatar_surprised_closed: null,
        });
      } catch (e) {
        console.error("Failed to remove avatar:", e);
      }
    } else {
      if (browser) {
        localStorage.removeItem("temp_selfie");
        localStorage.removeItem("temp_expressions");
        localStorage.removeItem("temp_landmarks");
        localStorage.removeItem("temp_gender");
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

    mode = "no-avatar";

    if (onAvatarRemoved) {
      onAvatarRemoved();
    }
  }

  // Initialize the MediaPipe detector
  async function initFaceDetector() {
    if (faceDetector) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
    });
  }

  let lastDetectTime = 0;
  const DETECTION_INTERVAL_MS = 80; // ~12 FPS for smooth face alignment tracking without GPU throttling

  // Predict loop running against the live video element
  function predictLoop() {
    if (!videoElement || !stream || !faceDetector || mode !== "camera") {
      isFaceAligned = false;
      alignmentFeedback = "none";
      faceBox = null;
      return;
    }

    if (videoElement.readyState >= 2) {
      // HAVE_CURRENT_DATA or higher
      const now = performance.now();
      if (now - lastDetectTime >= DETECTION_INTERVAL_MS) {
        lastDetectTime = now;
        try {
          const startTimeMs = performance.now();
          const detections = faceDetector.detectForVideo(
            videoElement,
            startTimeMs,
          ).detections;

          if (detections.length > 0) {
            const face = detections[0].boundingBox;

            // videoElement sizes are normalized 0 to 1 in MediaPipe if using absolute dimensions,
            // but detectForVideo returns raw pixel coordinates based on input size.
            const vWidth = videoElement.videoWidth;
            const vHeight = videoElement.videoHeight;

            if (face && vWidth && vHeight) {
              // Calculate midpoints
              const faceCenterX = face.originX + face.width / 2;
              const faceCenterY = face.originY + face.height / 2;
              const videoCenterX = vWidth / 2;
              const videoCenterY = vHeight / 2;

              // Check alignment conditions:
              // 1. Is the face centered? (Within 15% margin of center)
              const isCentered =
                Math.abs(faceCenterX - videoCenterX) < vWidth * 0.15 &&
                Math.abs(faceCenterY - videoCenterY) < vHeight * 0.15;

              // 2. Is the face close enough? (Not too far: face width >= 33% of video width)
              const isCloseEnough = face.width >= vWidth * 0.33;

              // 3. Is the face too close? (Not too close: face width <= 65% of video width)
              const isNotTooClose = face.width <= vWidth * 0.65;

              // Calculate mirrored left coordinate to match mirrored video feed
              const faceLeft =
                ((vWidth - (face.originX + face.width)) / vWidth) * 100;

              faceBox = {
                left: faceLeft,
                top: (face.originY / vHeight) * 100,
                width: (face.width / vWidth) * 100,
                height: (face.height / vHeight) * 100,
              };

              if (!isCloseEnough) {
                alignmentFeedback = "too-far";
                isFaceAligned = false;
              } else if (!isCentered) {
                alignmentFeedback = "not-centered";
                isFaceAligned = false;
              } else if (!isNotTooClose) {
                alignmentFeedback = "too-close";
                isFaceAligned = false;
              } else {
                alignmentFeedback = "aligned";
                isFaceAligned = true;
              }
            }
          } else {
            isFaceAligned = false;
            alignmentFeedback = "none";
            faceBox = null;
          }
        } catch (err) {
          console.error("Face detection loop error:", err);
        }
      }
    }

    animationFrameId = requestAnimationFrame(predictLoop);
  }

  async function startCamera() {
    if (!browser) return;
    cameraLoading = true;
    cameraError = null;
    try {
      // Parallel load the face detector while camera initializes
      await initFaceDetector();

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
          // Kick off the frame checking loop
          predictLoop();
        };
      }
    } catch (err: any) {
      console.error("Error accessing camera/detector:", err);
      cameraError = "Could not access camera or model.";
      cameraLoading = false;
    }
  }

  function stopCamera() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    isFaceAligned = false;
    alignmentFeedback = "none";
    faceBox = null;
  }

  async function uploadSelfieImage(file: File | Blob) {
    const formData = new FormData();
    formData.append("file", file, "selfie.png");
    const client = await apiClient;
    try {
      const response = await client.postUpload(
        { generate_expressions: "true" },
        formData as any,
      );
      if (response.status === 200) {
        return response.data;
      } else {
        const errObj: any = new Error("Upload failed");
        errObj.response = response;
        throw errObj;
      }
    } catch (err: any) {
      throw err;
    }
  }

  async function processSelfieBlob(blob: Blob) {
    capturedBlob = blob;
    mode = "uploading";
    uploadError = null;
    userFriendlyErrorMsg = "";
    uploadingProgress = "Generating avatar expressions...";

    try {
      const res = await uploadSelfieImage(blob);
      await saveAvatar(res.url, res.expressions, res.gender || undefined);
      currentSelfieUrl = res.url;

      toaster.success({
        title: "Avatar Updated",
        description: "Your new avatar has been saved.",
      });

      if (onUploadComplete) {
        onUploadComplete(res);
      }
      isCapturing = false;
      mode = "preview";
    } catch (err: any) {
      console.error("Failed to upload selfie:", err);
      isCapturing = false;

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.error || "An error occurred";
        if (status === 400) {
          uploadError = "No face found in photo";
          userFriendlyErrorMsg =
            "Please make sure your face is clearly visible, well-lit, and centered inside the circle.";
        } else if (status === 422) {
          uploadError = "Landmark generation failed";
          userFriendlyErrorMsg =
            "We couldn't detect facial details. Please try retaking the photo in better lighting.";
        } else if (status === 500) {
          uploadError = "General server error";
          userFriendlyErrorMsg =
            "A server error occurred. Please try uploading again or retake the photo.";
        } else {
          uploadError = `Upload failed (Status ${status})`;
          userFriendlyErrorMsg =
            message ||
            "An unexpected error occurred. Please check and try again.";
        }
      } else {
        uploadError = "Connection failed";
        userFriendlyErrorMsg =
          err.message ||
          "Failed to reach the server. Please check your internet connection.";
      }
      mode = "error";
    }
  }

  function captureSelfie() {
    if (!videoElement || !stream || isCapturing) return;
    isCapturing = true;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      const width = settings.width || videoElement.videoWidth || 640;
      const height = settings.height || videoElement.videoHeight || 480;

      // Direct single-pass 512x512 canvas scaling & JPEG encoding for instant upload
      const targetSize = 512;
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        isCapturing = false;
        return;
      }

      const size = Math.min(width, height);
      // Mirror horizontally
      ctx.translate(targetSize, 0);
      ctx.scale(-1, 1);

      const sx = (width - size) / 2;
      const sy = (height - size) / 2;
      ctx.drawImage(videoElement, sx, sy, size, size, 0, 0, targetSize, targetSize);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            stopCamera();
            processSelfieBlob(blob);
          } else {
            console.error("Failed to generate blob");
            isCapturing = false;
          }
        },
        "image/jpeg",
        0.75,
      );
    } catch (e: any) {
      console.error("Capture failed:", e);
      isCapturing = false;
    }
  }

  function retryUpload() {
    if (capturedBlob) {
      processSelfieBlob(capturedBlob);
    }
  }

  function retakePhoto() {
    capturedBlob = null;
    uploadError = null;
    mode = "camera";
    if (browser) {
      setTimeout(() => startCamera(), 50);
    }
  }

  function handleCancel() {
    stopCamera();
    if (onCancel) {
      onCancel();
    } else {
      if (currentSelfieUrl) {
        mode = "preview";
      } else {
        mode = "no-avatar";
      }
    }
  }

  // Start camera on mount if in camera mode
  if (browser && initialMode === "camera") {
    setTimeout(() => startCamera(), 50);
  }

  onDestroy(() => {
    stopCamera();
  });
</script>

<div
  class="card bg-base-200 border border-base-300 shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
>
  <div class="card-body items-center text-center p-6 gap-6 relative">
    <!-- 1. Header (Title & Subtitle) - Dynamic text, static position -->
    <div class="flex flex-col gap-1 min-h-[4.5rem] justify-center w-full">
      {#if mode === "loading"}
        <p class="text-sm text-base-content/70">Checking avatar...</p>
      {:else if mode === "preview"}
        <h2 class="card-title text-2xl font-black text-white justify-center">
          Your Avatar
        </h2>
      {:else if mode === "no-avatar"}
        <h2 class="card-title text-2xl font-black text-white justify-center">
          No Avatar Set
        </h2>
        <p class="text-sm text-base-content/70">
          Take a selfie to generate your 3D avatar!
        </p>
      {:else if mode === "camera"}
        <h2 class="card-title text-2xl font-black text-white justify-center">
          Create Custom Avatar
        </h2>
        <p class="text-sm text-base-content/70">
          Take a selfie to generate your 3D avatar!
        </p>
      {:else if mode === "uploading"}
        <h2 class="card-title text-2xl font-black text-white justify-center">
          Processing...
        </h2>
        <p class="text-sm text-base-content/70">{uploadingProgress}</p>
      {:else if mode === "error"}
        <h2
          class="card-title text-2xl font-black text-white justify-center text-error"
        >
          Upload Failed
        </h2>
        <p class="text-xs text-error font-semibold">{uploadError}</p>
      {/if}
    </div>

    <!-- 2. Circle Container - STATIC POSITION, STATIC SIZE -->
    <div
      class="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 shadow-xl bg-base-300 flex items-center justify-center transition-colors duration-300 {mode ===
        'camera' && faceDetector
        ? alignmentFeedback === 'aligned'
          ? 'border-green-500'
          : 'border-red-500'
        : 'border-base-300'}"
    >
      {#if mode === "loading" || mode === "uploading"}
        <!-- Spinner inside circle -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-base-300 text-base-content"
        >
          <span class="loading loading-spinner text-primary loading-lg"></span>
        </div>
      {:else if mode === "preview" && currentSelfieUrl}
        <!-- Active Avatar Image -->
        <img
          src={currentSelfieUrl}
          alt="Your avatar"
          class="object-cover w-full h-full"
        />
      {:else if mode === "no-avatar"}
        <!-- Placeholder User Icon -->
        <div
          class="absolute inset-0 bg-base-300/30 flex items-center justify-center text-base-content/20"
        >
          <Iconify
            icon="material-symbols:person-outline"
            style="font-size: 8rem;"
          />
        </div>
      {:else if mode === "camera"}
        <!-- Camera Video Feed -->
        {#if cameraLoading}
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-base-300 text-base-content"
          >
            <span class="loading loading-spinner text-primary loading-lg"
            ></span>
            <span
              class="text-xs font-semibold uppercase tracking-wider text-base-content/70 mt-2"
              >Starting Camera...</span
            >
          </div>
        {/if}

        {#if cameraError}
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-base-300 p-4 text-center"
          >
            <Iconify
              icon="material-symbols:videocam-off-outline"
              style="font-size: 2.5rem; color: var(--color-error, #f87171);"
            />
            <p class="text-xs text-base-content/80 leading-relaxed mt-2">
              {cameraError}
            </p>
            <button
              type="button"
              onclick={startCamera}
              class="btn btn-sm btn-neutral mt-2"
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

          <!-- Detected Face Box with Arrows -->
          {#if faceDetector && faceBox}
            <div
              class="absolute border-2 rounded-lg transition-colors duration-300 pointer-events-none z-10 {isFaceAligned
                ? 'border-success'
                : 'border-error/80'}"
              style="left: {faceBox.left}%; top: {faceBox.top}%; width: {faceBox.width}%; height: {faceBox.height}%;"
            >
              {#if alignmentFeedback === "too-far"}
                <!-- Corner arrows pointing outwards to fill the larger box -->
                <!-- Top-Left Corner -->
                <div
                  class="absolute -top-4 -left-4 text-error/90 arrow-tl pointer-events-none"
                >
                  <svg
                    class="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <!-- Top-Right Corner -->
                <div
                  class="absolute -top-4 -right-4 text-error/90 arrow-tr pointer-events-none"
                >
                  <svg
                    class="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <!-- Bottom-Left Corner -->
                <div
                  class="absolute -bottom-4 -left-4 text-error/90 arrow-bl pointer-events-none"
                >
                  <svg
                    class="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
                <!-- Bottom-Right Corner -->
                <div
                  class="absolute -bottom-4 -right-4 text-error/90 arrow-br pointer-events-none"
                >
                  <svg
                    class="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              {/if}
            </div>
          {/if}

          <!-- Alignment instruction overlay inside the circle -->
          {#if faceDetector}
            <div
              class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10"
            >
              <span
                class="px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors duration-300"
              >
                {#if alignmentFeedback === "none"}
                  No Face Detected
                {:else if alignmentFeedback === "too-far"}
                  Move Closer
                {:else if alignmentFeedback === "too-close"}
                  Move Back
                {:else if alignmentFeedback === "not-centered"}
                  Center Face
                {:else if alignmentFeedback === "aligned"}
                  Perfect!
                {/if}
              </span>
            </div>
          {/if}
        {/if}
      {:else if mode === "error"}
        <!-- Retry Upload Panel -->
        <div
          class="absolute inset-0 flex flex-col items-center justify-center bg-base-300 p-6 text-center"
        >
          <Iconify
            icon="material-symbols:error-outline"
            style="font-size: 3rem; color: var(--color-error, #f87171);"
          />
          <p class="text-xs text-base-content/80 leading-relaxed mt-4">
            {userFriendlyErrorMsg}
          </p>
        </div>
      {/if}
    </div>

    <!-- 4. Dynamic Actions Panel - Animates elements smoothly -->
    <div class="flex flex-col gap-2 w-full min-h-[4.5rem] justify-center">
      {#if mode === "preview"}
        <div
          transition:slide={{ duration: 200 }}
          class="flex flex-col gap-2 w-full"
        >
          <button
            type="button"
            class="btn btn-primary w-full rounded-full gap-2 font-bold shadow-md"
            onclick={() => {
              mode = "camera";
              if (browser) {
                setTimeout(() => startCamera(), 50);
              }
            }}
          >
            <Iconify
              icon="material-symbols:photo-camera-outline"
              style="font-size: 1.25rem;"
            />
            Change Avatar
          </button>
          <button
            type="button"
            class="btn btn-outline btn-error w-full rounded-full gap-2 font-semibold"
            onclick={deleteAvatar}
          >
            <Iconify
              icon="material-symbols:delete-outline"
              style="font-size: 1.25rem;"
            />
            Remove Avatar
          </button>
        </div>
      {:else if mode === "no-avatar"}
        <div transition:slide={{ duration: 200 }} class="w-full">
          <button
            type="button"
            class="btn btn-primary w-full rounded-full gap-2 font-bold shadow-md"
            onclick={() => {
              mode = "camera";
              if (browser) {
                setTimeout(() => startCamera(), 50);
              }
            }}
          >
            <Iconify
              icon="material-symbols:photo-camera-outline"
              style="font-size: 1.25rem;"
            />
            Set Up Avatar
          </button>
        </div>
      {:else if mode === "camera" && !cameraError}
        <div
          transition:slide={{ duration: 200 }}
          class="flex flex-col gap-2 w-full"
        >
          <button
            type="button"
            onclick={captureSelfie}
            disabled={cameraLoading || isCapturing}
            class="btn btn-primary btn-lg w-full rounded-full gap-2 font-bold shadow-md"
          >
            {#if isCapturing}
              <span class="loading loading-spinner loading-sm"></span>
              Processing...
            {:else}
              <Iconify
                icon="material-symbols:photo-camera-outline"
                style="font-size: 1.5rem;"
              />
              Take Photo
            {/if}
          </button>

          <div class="flex flex-row gap-2 w-full justify-center">
            {#if onSkip}
              <button
                type="button"
                onclick={onSkip}
                class="btn btn-neutral flex-1 font-semibold"
              >
                Skip
              </button>
            {/if}

            {#if onCancel || initialMode === "auto"}
              <button
                type="button"
                onclick={handleCancel}
                class="btn btn-neutral flex-1 font-semibold"
              >
                Cancel
              </button>
            {/if}
          </div>
        </div>
      {:else if mode === "camera" && cameraError}
        <div
          transition:slide={{ duration: 200 }}
          class="flex flex-row gap-2 w-full justify-center"
        >
          {#if onSkip}
            <button
              type="button"
              onclick={onSkip}
              class="btn btn-neutral flex-1 font-semibold"
            >
              Skip
            </button>
          {/if}

          {#if onCancel || initialMode === "auto"}
            <button
              type="button"
              onclick={handleCancel}
              class="btn btn-neutral flex-1 font-semibold"
            >
              Cancel
            </button>
          {/if}
        </div>
      {:else if mode === "error"}
        <div
          transition:slide={{ duration: 200 }}
          class="flex flex-col gap-2 w-full"
        >
          <button
            type="button"
            onclick={retakePhoto}
            class="btn btn-neutral w-full rounded-full gap-2 font-semibold"
          >
            Retake Photo
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes slide-out-tl {
    0% {
      transform: translate(0, 0) rotate(270deg);
      opacity: 0.4;
    }
    50% {
      transform: translate(-8px, -8px) rotate(270deg);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) rotate(270deg);
      opacity: 0.4;
    }
  }
  @keyframes slide-out-tr {
    0% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 0.4;
    }
    50% {
      transform: translate(8px, -8px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) rotate(0deg);
      opacity: 0.4;
    }
  }
  @keyframes slide-out-bl {
    0% {
      transform: translate(0, 0) rotate(180deg);
      opacity: 0.4;
    }
    50% {
      transform: translate(-8px, 8px) rotate(180deg);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) rotate(180deg);
      opacity: 0.4;
    }
  }
  @keyframes slide-out-br {
    0% {
      transform: translate(0, 0) rotate(90deg);
      opacity: 0.4;
    }
    50% {
      transform: translate(8px, 8px) rotate(90deg);
      opacity: 1;
    }
    100% {
      transform: translate(0, 0) rotate(90deg);
      opacity: 0.4;
    }
  }

  .arrow-tl {
    animation: slide-out-tl 1.5s infinite ease-in-out;
  }
  .arrow-tr {
    animation: slide-out-tr 1.5s infinite ease-in-out;
  }
  .arrow-bl {
    animation: slide-out-bl 1.5s infinite ease-in-out;
  }
  .arrow-br {
    animation: slide-out-br 1.5s infinite ease-in-out;
  }
</style>
