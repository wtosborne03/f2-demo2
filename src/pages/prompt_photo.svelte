<script lang="ts">
  import Compressor from "compressorjs";
  import { get } from "svelte/store";
  import { player_state } from "../stores/player_state";
  import type { PromptData } from "../types/page_data";

  import Spinner from "$lib/components/spinner.svelte";
  import { gameClient } from "$lib/gameService";
  import Icon from "@iconify/svelte";

  let m_data: PromptData;
  m_data = get(player_state).pageData;

  let base64Image: string | null = null;
  let fileinput: HTMLInputElement;
  let loading = false;

  async function handleFileInput(event: Event) {
    submit_ready();
    loading = true;
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      new Compressor(file, {
        quality: 0.3,
        maxWidth: 900,
        maxHeight: 900,
        success(result) {
          sendCompressedImage(result);
        },
        error(err) {
          console.log(err.message);
        },
      });
    }
  }

  function sendCompressedImage(file: File | Blob) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      base64Image = e.target?.result as string;
      submit_prompt(base64Image);
    };
    reader.readAsDataURL(file);
  }

  function submit_ready() {
    gameClient.sendPlayerInput({
      payload: {
        $case: "photoReady",
        photoReady: {},
      },
    });
  }

  function submit_prompt(image_b64: string) {
    gameClient.sendPlayerInput({
      payload: {
        $case: "promptPhotoData",
        promptPhotoData: {
          photoUrl: image_b64,
        },
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  {#if loading}
    <Spinner />
  {/if}
  <div
    class="mb-12 mt-2 p-3 pt-1.5 text-lg text-center border-4 leading-8 border-primary-500 bg-primary-contrast-50 rounded-container"
  >
    <span class="text-sm sitalic opacity-65">Prompt:</span><br />
    {m_data.question}
  </div>
  <button
    class="btn preset-tonal-primary big-fun-button"
    on:click={async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      fileinput.click();
    }}
    aria-label="Upload photo"
    disabled={loading}
  >
    <span class="left">
      <Icon font-size="1.9rem" icon="material-symbols:photo-camera" />
    </span>
    <span class="label">Add your photo</span>
    <span class="right">
      <Icon font-size="1.9rem" icon="material-symbols:photo" />
    </span>
    <span class="sparks" aria-hidden="true">
      <span class="spark"></span>
      <span class="spark"></span>
      <span class="spark"></span>
      <span class="spark"></span>
      <span class="spark"></span>
      <span class="spark"></span>
    </span>
  </button>
  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png"
    on:change={(e) => handleFileInput(e)}
    bind:this={fileinput}
  />
</div>

<style>
  .big-fun-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.85rem 1.4rem;
    font-size: 1.05rem;
    border-radius: 999px;

    transition:
      transform 180ms cubic-bezier(0.2, 0.9, 0.3, 1),
      box-shadow 180ms;
    transform: translateZ(0);
    overflow: visible;
    user-select: none;
  }

  .big-fun-button .label {
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .big-fun-button:hover {
    transform: scale(1.03);
  }

  .big-fun-button:active {
    transform: scale(0.94) translateY(0);
    transition-duration: 90ms;
  }

  .big-fun-button:focus-visible {
    outline: 3px solid rgba(99, 102, 241, 0.18);
    outline-offset: 4px;
  }

  /* Sparks burst */
  .sparks {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    pointer-events: none;
  }
  .spark {
    position: absolute;
    left: 0;
    top: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
    background: linear-gradient(135deg, #ffd166, #ff8fab);
  }

  .big-fun-button:active .spark {
    animation: burst 520ms cubic-bezier(0.12, 0.9, 0.2, 1) forwards;
  }

  .spark:nth-child(1) {
    --x: -38px;
    --y: -26px;
    background: #ffb4be;
    animation-delay: 0ms;
  }
  .spark:nth-child(2) {
    --x: 36px;
    --y: -22px;
    background: #ffd166;
    animation-delay: 10ms;
  }
  .spark:nth-child(3) {
    --x: -46px;
    --y: 10px;
    background: #ff8fab;
    animation-delay: 20ms;
  }
  .spark:nth-child(4) {
    --x: 44px;
    --y: 12px;
    background: #6ee7b7;
    animation-delay: 30ms;
  }
  .spark:nth-child(5) {
    --x: -6px;
    --y: 44px;
    background: #93c5fd;
    animation-delay: 40ms;
  }
  .spark:nth-child(6) {
    --x: 10px;
    --y: 46px;
    background: #f0abfc;
    animation-delay: 50ms;
  }

  @keyframes burst {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    60% {
      opacity: 0.9;
    }
    100% {
      opacity: 0;
      transform: translate(calc(var(--x)), calc(var(--y))) scale(0.25);
    }
  }

  /* small pop for icons */
  .big-fun-button .left,
  .big-fun-button .right {
    display: flex;
    align-items: center;
  }
  .big-fun-button:active .left,
  .big-fun-button:active .right {
    transform: scale(0.85);
    transition: transform 90ms;
  }

  /* disabled state */
  .big-fun-button[disabled] {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
</style>
