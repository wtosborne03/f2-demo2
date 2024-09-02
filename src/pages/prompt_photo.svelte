<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";
  import imageCompression from "browser-image-compression";
  import { stat } from "fs";

  let m_data: PromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let base64Image: string | null = null;
  let fileinput: HTMLInputElement;
  let statuse = "";

  async function handleFileInput(event: Event) {
    statuse = "Compressing Image...";
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (file) {
      const options = {
        maxSizeMB: 0.1,
      };
      const compressedFile = await imageCompression(file, options);
      statuse = "Compressing Image... Done";
      statuse = "File size: " + compressedFile.size / 1024 / 1024 + " MB";
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        base64Image = e.target?.result as string;
        submit_prompt(base64Image);
      };
      reader.readAsDataURL(compressedFile);
    }
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
  <div>Select Photo:</div>
  <div class="mb-2 p-4">{m_data.question}</div>
  {statuse}
  <button class="btn variant-filled" on:click={() => fileinput.click()}
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
