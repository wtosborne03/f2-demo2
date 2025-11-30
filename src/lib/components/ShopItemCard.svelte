<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Paths } from "$lib/backend/api";
  import { getHue } from "$lib/util/color";

  export let item: Paths.GetShopItemsById.Responses.$200;
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
  class="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl flex flex-col justify-between text-center overflow-hidden border border-slate-600/20 hover:border-purple-400/50 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
  style={`background-color: ${getHue(item.id)}`}
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

  <div class="w-32 h-32 mx-auto rounded-xl overflow-hidden mt-2">
    <img
      src={`${thumbnailPrefix}/${item.thumbnail}`}
      alt={item.name}
      class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
    />
  </div>

  <div class="p-2 pb-1">
    <h3 class="text-lg font-semibold mb-2">{item.name}</h3>
    {#if showCategory}
      <span
        class="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded mb-2 inline-block"
      >
        {categories[item.type]}
      </span>
    {/if}
    {#if item.salePrice !== undefined && item.salePrice < item.price}
      <div class="flex items-center space-x-2 flex-col">
        <span class="flex flex-row items-center gap-2">
          <span class="text-lg font-bold text-green-200"
            >${item.salePrice.toFixed(2)}</span
          >
          <span class="text-sm text-gray-400 line-through"
            >${item.price.toFixed(2)}</span
          ></span
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
