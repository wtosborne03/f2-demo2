<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Paths } from "$lib/backend/api";
  import { getHue } from "$lib/util/color";
  import { Card } from "m3-svelte";

  export let item: Paths.GetShopItemsById.Responses.$200;
  export let thumbnailPrefix: string;
  export let categories: { [key: string]: string };
  export let showCategory = false;

  function handleClick() {
    goto(`/shop/${item.id}`);
  }
</script>

<Card variant="filled" onclick={handleClick}>
  <div class="card-content" style={`--item-hue: ${getHue(item.id)}`}>
    <!-- Sale Badge -->
    {#if item.salePrice !== undefined && item.salePrice < item.price}
      <div class="sale-badge">
        SALE
      </div>
    {/if}

    <div class="thumbnail-wrapper">
      <img
        src={`${thumbnailPrefix}/${item.thumbnail}`}
        alt={item.name}
        class="thumbnail"
      />
    </div>

    <div class="info-wrapper">
      <h3 class="item-name">{item.name}</h3>
      {#if showCategory}
        <span class="category-badge">
          {categories[item.type]}
        </span>
      {/if}
      
      {#if item.salePrice !== undefined && item.salePrice < item.price}
        <div class="price-container">
          <div class="prices">
            <span class="sale-price">${item.salePrice.toFixed(2)}</span>
            <span class="original-price">${item.price.toFixed(2)}</span>
          </div>
          <span class="discount-percent">
            -{Math.round(((item.price - item.salePrice) / item.price) * 100)}%
          </span>
        </div>
      {:else}
        <div class="regular-price">
          ${item.price.toFixed(2)}
        </div>
      {/if}
    </div>
  </div>
</Card>

<style>
  :global(.m3-card) {
    height: 100%;
  }

  .card-content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    padding: 1rem;
    height: 100%;
    box-sizing: border-box;
    background-color: var(--item-hue);
    border-radius: inherit;
  }

  .sale-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 10;
    background-color: var(--m3c-error);
    color: var(--m3c-on-error);
    padding: 0.25rem 0.5rem;
    border-radius: var(--m3-shape-full);
    font-family: var(--m3-font); font-size: 0.688rem; line-height: 1.455; font-weight: 500;
    font-weight: bold;
  }

  .thumbnail-wrapper {
    width: 8rem;
    height: 8rem;
    margin: 0 auto;
    border-radius: var(--m3-shape-medium);
    overflow: hidden;
    margin-bottom: 0.75rem;
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s var(--m3-easing-spatial);
  }

  :global(.m3-card:hover) .thumbnail {
    transform: scale(1.1);
  }

  .info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .item-name {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
    margin: 0;
    color: var(--m3c-on-surface);
  }

  .category-badge {
    font-family: var(--m3-font); font-size: 0.688rem; line-height: 1.455; font-weight: 500;
    background-color: var(--m3c-primary-container-subtle);
    color: var(--m3c-on-primary-container-subtle);
    padding: 0.25rem 0.5rem;
    border-radius: var(--m3-shape-small);
  }

  .price-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .prices {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .sale-price {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
    color: #81c784;
    font-weight: bold;
  }

  .original-price {
    font-family: var(--m3-font); font-size: 0.75rem; line-height: 1.333; font-weight: 400;
    color: var(--m3c-on-surface-variant);
    text-decoration: line-through;
  }

  .discount-percent {
    font-family: var(--m3-font); font-size: 0.688rem; line-height: 1.455; font-weight: 500;
    background-color: rgba(239, 83, 80, 0.2);
    color: #ef5350;
    padding: 0.125rem 0.375rem;
    border-radius: var(--m3-shape-small);
  }

  .regular-price {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
    color: var(--m3c-on-surface);
    font-weight: bold;
  }
</style>
