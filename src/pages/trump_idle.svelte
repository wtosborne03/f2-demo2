<script lang="ts">
  import Icon from "@iconify/svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { PlayerInputPayload } from "$lib/wsapi/game";

  // Keep it simple: list of available animations and an icon for each (Iconify ids)
  const animations: { label: string; value: string; icon: string }[] = [
    { label: "Twerk", value: "twerk", icon: "mdi:dance-pole" },
    { label: "Dance", value: "dance", icon: "mdi:human-female-dance" },
    { label: "Breakdance", value: "breakdance", icon: "mdi:rotate-3d" },
    { label: "Backflip", value: "backflip", icon: "mdi:run" },
    { label: "Fall", value: "fall", icon: "fa6-solid:person-falling-burst" },
  ];

  let sending = false;

  function playAnimation(animation: string) {
    if (sending) return;
    sending = true;

    try {
      gameClient.sendInput({
        type: "promptTextData",
        answer: animation,
      });
    } finally {
      // small debounce so UI doesn't spam
      setTimeout(() => (sending = false), 600);
    }
  }
</script>

<!--
  Layout notes:
  - Tailwind-first layout
  - Mobile-first, simple, accessible
  - "American government" colors via navy + red gradient background, serif headings
-->

<div
  class="min-h-screen w-screen bg-linear-to-br from-sky-900 via-indigo-900 to-red-900 flex items-center justify-center p-6"
>
  <main
    class="w-full max-w-lg bg-white/95 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden"
    role="region"
    aria-labelledby="animations-heading"
  >
    <header class="px-6 py-5 border-b border-red-600/40 bg-white/60">
      <div class="flex items-center gap-3">
        <!-- decorative stars + title -->
        <div class="flex items-center gap-1 text-sky-900">
          <span class="text-xl">★</span>
          <span class="text-xl">★</span>
          <span class="text-xl">★</span>
        </div>
        <h1
          id="animations-heading"
          class="font-serif text-sky-900 text-lg md:text-xl uppercase tracking-wider"
        >
          Presidential Actions
        </h1>
      </div>
    </header>

    <section class="p-6">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each animations as a}
          <button
            type="button"
            class="flex items-center gap-3 w-full justify-center py-3 px-4 rounded-lg
                   bg-white text-sky-900 font-semibold shadow
                   transition transform duration-150 focus:outline-none focus-visible:ring-4
                   focus-visible:ring-sky-200 disabled:opacity-60 disabled:cursor-not-allowed"
            on:click={() => playAnimation(a.value)}
            aria-label={`Play ${a.label}`}
            disabled={sending}
          >
            <span class="w-6 h-6 flex items-center justify-center text-sky-700">
              <Icon icon={a.icon} width="20" height="20" />
            </span>
            <span class="text-sm md:text-base">{a.label}</span>
          </button>
        {/each}
      </div>
    </section>
  </main>
</div>
