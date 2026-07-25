<script lang="ts">
  import Compressor from "compressorjs";
  import { get } from "svelte/store";
  import type { PromptData } from "../types/page_data";

  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let base64Image: string | null = null;
  let fileinput: HTMLInputElement;
  let loading = false;

  async function uploadCompressedImage(file: File | Blob): Promise<string> {
    const formData = new FormData();
    formData.append("file", file, "photo.webp");

    const response = await fetch(`${import.meta.env.VITE_PUBLIC_API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  }

  async function handleFileInput(event: Event) {
    loading = true;
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (file) {
      new Compressor(file, {
        quality: 0.8,
        mimeType: "image/webp",
        maxWidth: 1024,
        maxHeight: 1024,
        async success(result) {
          try {
            const url = await uploadCompressedImage(result);
            submit_prompt(url);
            submit_ready();
          } catch (err: any) {
            console.error("Failed to upload image to S3, falling back to base64:", err);
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
              base64Image = e.target?.result as string;
              submit_prompt(base64Image);
              submit_ready();
            };
            reader.readAsDataURL(result);
          }
        },
        error(err) {
          console.error(err.message);
          loading = false;
        },
      });
    }
  }

  function submit_ready() {
    gameClient.sendInput({
      type: "photoReady",
    });
  }

  function submit_prompt(image_b64: string) {
    gameClient.sendInput({
      type: "promptPhotoData",
      promptPhotoData: {
        photoUrl: image_b64,
      },
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center space-y-6">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full">
    <span class="text-xs uppercase font-extrabold opacity-60 tracking-wider mb-1">Prompt</span>
    <p class="text-xl font-bold leading-relaxed">{m_data.question}</p>
  </div>

  <button
    class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-3"
    onclick={async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      fileinput.click();
    }}
    aria-label="Upload photo"
    disabled={loading}
  >
    {#if loading}
      <span class="loading loading-spinner"></span>
      Uploading...
    {:else}
      <Icon class="text-2xl" icon="material-symbols:photo-camera" />
      <span>Add your photo</span>
      <Icon class="text-2xl" icon="material-symbols:photo" />
    {/if}
  </button>
  
  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png"
    onchange={handleFileInput}
    bind:this={fileinput}
  />
</div>
