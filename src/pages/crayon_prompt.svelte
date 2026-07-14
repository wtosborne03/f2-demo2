<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let answer_text = "";

  // Track which twists are selected
  let twistSweaty = false;
  let twistOffice = false;
  let twist3am = false;

  function submit_prompt() {
    let finalPrompt = answer_text.trim();
    let addition = "";

    // Dynamically append the "Urgent Twists" strings
    if (twistSweaty) {
      addition +=
        ", hyper-detailed sweat drops, moist, super sweaty and sticky";
    }
    if (twistOffice) {
      addition +=
        ", in a sad corporate office cubicle under depressing fluorescent lights";
    }
    if (twist3am) {
      addition +=
        ", grainy night-vision trail-cam footage, timestamp in corner 03:00 AM";
    }

    gameClient.sendInput({
      type: "promptTextData",
      answer: finalPrompt,
      addition: addition,
    });
  }
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-8">
  <div class="text-5xl mb-4 text-center">🎨</div>

  <form
    class="flex flex-col items-center w-full gap-6"
    onsubmit={(e) => { e.preventDefault(); submit_prompt(); }}
  >
    <!-- Core Prompt Input -->
    <label class="form-control w-full">
      <div class="label py-1">
        <span class="label-text font-bold text-sm text-base-content/85">Image Prompt</span>
      </div>
      <input
        type="text"
        class="input input-bordered input-lg w-full font-semibold"
        maxlength={140}
        placeholder="Describe what you want to draw..."
        bind:value={answer_text}
      />
      <div class="label py-1 justify-end">
        <span class="label-text-alt text-xs text-base-content/50">
          {answer_text.length} / 140
        </span>
      </div>
    </label>

    <!-- Urgent Twists Section -->
    <div class="w-full flex flex-col gap-2">
      <span class="text-xs font-bold uppercase tracking-wider text-base-content/60 px-1 mb-1">
        Urgent Twists
      </span>

      <label class="label cursor-pointer flex items-center justify-start gap-4 p-2 hover:bg-base-200/50 rounded-xl transition-colors">
        <input
          type="checkbox"
          bind:checked={twistSweaty}
          class="checkbox checkbox-primary checkbox-md"
        />
        <span class="text-base font-bold">🥵 Make it sweaty</span>
      </label>

      <label class="label cursor-pointer flex items-center justify-start gap-4 p-2 hover:bg-base-200/50 rounded-xl transition-colors">
        <input
          type="checkbox"
          bind:checked={twistOffice}
          class="checkbox checkbox-primary checkbox-md"
        />
        <span class="text-base font-bold">💼 Mr. John Corporate</span>
      </label>

      <label class="label cursor-pointer flex items-center justify-start gap-4 p-2 hover:bg-base-200/50 rounded-xl transition-colors">
        <input
          type="checkbox"
          bind:checked={twist3am}
          class="checkbox checkbox-primary checkbox-md"
        />
        <span class="text-base font-bold">📹 3AM type Beat</span>
      </label>
    </div>

    <GameSubmit onSubmit={submit_prompt} />
  </form>
</div>
