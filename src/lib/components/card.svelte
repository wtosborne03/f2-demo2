<script lang="ts">
  export let flipped = false;
  export let value = "";
  export let color = "";
  export let type = "";

  const flipCard = () => {
    flipped = !flipped;
  };
</script>

<div class="card w-24 h-32 relative perspective-1000 cursor-pointer">
  <div
    class="card-inner w-full h-full absolute transform-style-3d transition-transform duration-500 {flipped
      ? '[transform:rotateY(180deg)]'
      : ''}"
  >
    {#if flipped}
      <div
        class="card-front w-full h-full absolute flex flex-col justify-center text-3xl items-center scale-x-[-1] text-black bg-white border border-black rounded-lg"
      >
        <span style:color>{value}</span>
        <span style:color>{type}</span>
      </div>
    {:else}
      <div
        class="card-back w-full h-full absolute flex justify-center items-center bg-gray-600 rounded-lg rotate-y-180"
      >
        <span class="opacity-20 text-4xl">🍺</span>
      </div>
    {/if}
  </div>
</div>
