<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";
  import imageCompression from "browser-image-compression";
  import Compressor from "compressorjs";

  import {
    srcToWebP,
    blobToWebP,
    arrayBufferToWebP,
  } from "webp-converter-browser";
  import Spinner from "$lib/components/spinner.svelte";

  let m_data: PromptData;
  m_data = get<PlayerState>(player_state).page_data;

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
    sendMessage({
      type: "game",
      data: {
        type: "ready",
      },
    });
  }

  function submit_prompt(image_b64: string) {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        answer: image_b64,
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
  <div>Select Photo:</div>
  <div class="mb-2 p-4">{m_data.question}</div>
  <button class="btn preset-filled" on:click={() => fileinput.click()}
    >Choose</button
  >
  <input
    style="display:none"
    type="file"
    accept=".jpg, .jpeg, .png"
    on:change={(e) => handleFileInput(e)}
    bind:this={fileinput}
  />
</div>
