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
  <!-- Mobile-Optimized Full Screen Layout with Responsive Canvas & Scrollable Controls -->
  <div class="w-full h-full max-h-full flex flex-col justify-between overflow-hidden text-base-content p-0 relative">
    <!-- 1. TOP: 3D Preview Canvas Viewport -->
    <section class="flex-1 w-full relative min-h-[160px] sm:min-h-[220px]">
      <HorsePreviewCanvas 
        bind:attributes={horseAttributes} 
      />
    </section>

    <!-- 2. BOTTOM: Controls Card & Submit Button with Smooth Scroll Handling -->
    <section class="w-full max-w-xl mx-auto shrink-0 flex flex-col max-h-[62vh] sm:max-h-[56vh] shadow-2xl z-10">
      <!-- Scrollable Customization Box -->
      <div class="w-full overflow-y-auto overscroll-contain">
        <HorseMakerUI 
          bind:attributes={horseAttributes} 
        />
      </div>

      <!-- Prominent, Large Touch-Target Submit Button -->
      <button
        type="button"
        on:click={submitHorse}
        class="w-full py-4 sm:py-4.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg sm:text-xl uppercase tracking-wider shadow-2xl active:scale-[0.98] transition-all border-t-2 border-amber-300 flex items-center justify-center gap-2 shrink-0 select-none cursor-pointer"
      >
        <span>🚀 SPIT HORSE INTO MACHINE!</span>
      </button>
    </section>
  </div>
{:else}
  <!-- Submitted Waiting Screen -->
  <div class="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center p-6 gap-5">
    <div class="w-24 h-24 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center text-4xl shadow-2xl">
      🏇
    </div>
    <div class="flex flex-col gap-2 max-w-xs">
      <h2 class="text-2xl font-black text-amber-400 uppercase tracking-wide">
        HORSE SPIT INTO MACHINE!
      </h2>
      <p class="text-sm font-semibold text-slate-300 leading-relaxed">
        Look up at the TV screen! <span class="text-amber-300 font-extrabold">{horseAttributes.name}</span> is landing on the derby track!
      </p>
    </div>
  </div>
{/if}
