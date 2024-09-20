<script lang="ts">
  import { sendMessage } from "$lib";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { ProductPromptData, PromptData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: ProductPromptData;
  m_data = get<PlayerState>(player_state).page_data;

  let answer_text = "";

  function submit_prompt() {
    sendMessage({
      type: "game",
      data: {
        type: "answer",
        answer: answer_text,
      },
    });
  }
</script>

<div
  class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
  <aside
    class="alert variant-ghost text-center m-4 top-20 flex flex-col justify-center items-center"
  >
    <!-- Icon -->
    <!-- Message -->
    <div class="alert-message">
      <p class="">You're employed at:</p>
      <h3 class="h3">Company {m_data.team}</h3>
    </div>
    <!-- Actions -->
    <div class="alert-actions">
      Meet up with your coworkers to discuss synergy.
    </div>
  </aside>
</div>
