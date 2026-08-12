<script lang="ts">
  import { DEFAULT_HORSE_ATTRIBUTES, type HorseAttributes } from '$lib/components/horse/types';
  import HorsePreviewCanvas from '$lib/components/horse/HorsePreviewCanvas.svelte';
  import HorseMakerUI from '$lib/components/horse/HorseMakerUI.svelte';
  import { gameClient } from '$lib/wsapi/gameClient';

  let horseAttributes: HorseAttributes = JSON.parse(JSON.stringify(DEFAULT_HORSE_ATTRIBUTES));
  let submitted = false;

  function submitHorse() {
    submitted = true;
    gameClient.sendInput({
      type: 'join_horse',
      attributes: horseAttributes,
    });
  }
</script>

<svelte:head>
  <title>{horseAttributes.name || 'Horse Customization'}</title>
</svelte:head>

{#if !submitted}
  <!-- Full Screen Width Canvas with Bottom-Docked UI (No Vertical Overflow/Scroll) -->
  <div class="w-full h-full max-h-full flex flex-col justify-between overflow-hidden text-base-content p-0 relative">
    <!-- 1. TOP: 3D Preview Canvas (Fills 100% screen width & remaining height) -->
    <section class="flex-1 w-full relative min-h-0">
      <HorsePreviewCanvas 
        bind:attributes={horseAttributes} 
      />
    </section>

    <!-- 2. BOTTOM: Controls Card & Submit Button Docked Flush at Bottom -->
    <section class="w-full max-w-xl mx-auto shrink-0 pb-0 flex flex-col">
      <HorseMakerUI 
        bind:attributes={horseAttributes} 
      />
      <button
        on:click={submitHorse}
        class="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg uppercase tracking-wider shadow-2xl active:scale-95 transition-all border-t-2 border-amber-300"
      >
        🚀 SPIT HORSE INTO MACHINE!
      </button>
    </section>
  </div>
{:else}
  <!-- Submitted Waiting Screen -->
  <div class="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center p-6 gap-4">
    <div class="w-20 h-20 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center text-3xl">
      🏇
    </div>
    <h2 class="text-xl font-extrabold text-amber-400 uppercase tracking-wide">
      HORSE SPIT INTO MACHINE!
    </h2>
    <p class="text-sm font-medium text-slate-400">
      Look up at the TV screen! Your horse is landing on the derby track!
    </p>
  </div>
{/if}
