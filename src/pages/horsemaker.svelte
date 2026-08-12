<script lang="ts">
  import { DEFAULT_HORSE_ATTRIBUTES, type HorseAttributes } from '$lib/components/horse/types';
  import HorsePreviewCanvas from '$lib/components/horse/HorsePreviewCanvas.svelte';
  import HorseMakerUI from '$lib/components/horse/HorseMakerUI.svelte';

  let horseAttributes: HorseAttributes = JSON.parse(JSON.stringify(DEFAULT_HORSE_ATTRIBUTES));
</script>

<svelte:head>
  <title>{horseAttributes.name || 'Horse Customization'}</title>
</svelte:head>

<!-- Full Screen Width Canvas with Bottom-Docked UI (No Vertical Overflow/Scroll) -->
<div class="w-full h-full max-h-full flex flex-col justify-between overflow-hidden text-base-content p-0">
  <!-- 1. TOP: 3D Preview Canvas (Fills 100% screen width & remaining height) -->
  <section class="flex-1 w-full relative min-h-0">
    <HorsePreviewCanvas 
      bind:attributes={horseAttributes} 
    />
  </section>

  <!-- 2. BOTTOM: Controls Card Docked Flush at Bottom -->
  <section class="w-full max-w-xl mx-auto shrink-0 pb-0">
    <HorseMakerUI 
      bind:attributes={horseAttributes} 
    />
  </section>
</div>
