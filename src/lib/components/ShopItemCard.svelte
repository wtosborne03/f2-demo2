<script lang="ts">
  import { goto } from "$app/navigation";

  export let item: any;
  export let thumbnailPrefix: string;
  export let categories: { [key: string]: string };
  export let showCategory = false;

  function handleClick() {
    goto(`/shop/${item.id}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goto(`/shop/${item.id}`);
    }
  }
</script>

<div
  class="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-600/20 hover:border-purple-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  <!-- Sale Badge -->
  {#if item.salePrice !== undefined && item.salePrice < item.price}
    <div
      class="absolute top-3 right-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold"
    >
      SALE
    </div>
  {/if}

  <div class="w-32 h-24 mx-auto rounded-lg overflow-hidden">
    <img
      src={`${thumbnailPrefix}/${item.thumbnail}`}
      alt={item.name}
      class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
    />
  </div>

  <div class="p-4">
    <h3 class="text-lg font-semibold mb-2">{item.name}</h3>
    {#if showCategory}
      <span
        class="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded mb-2 inline-block"
      >
        {categories[item.type]}
      </span>
    {/if}
    {#if item.salePrice !== undefined && item.salePrice < item.price}
      <div class="flex items-center space-x-2">
        <span class="text-lg font-bold text-green-400"
          >${item.salePrice.toFixed(2)}</span
        >
        <span class="text-sm text-gray-400 line-through"
          >${item.price.toFixed(2)}</span
        >
        <span class="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
          -{Math.round(((item.price - item.salePrice) / item.price) * 100)}%
        </span>
      </div>
    {:else}
      <div class="text-lg font-bold text-white">
        ${item.price.toFixed(2)}
      </div>
    {/if}
  </div>
</div>
