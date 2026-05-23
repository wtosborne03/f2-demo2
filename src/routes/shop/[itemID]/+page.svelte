<script lang="ts">
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import Spinner from "$lib/components/spinner.svelte";
  import { initializeStripe, handlePayment } from "./paymentService";
  import { apiClient } from "$lib/backend/axios";
  import type { Paths } from "$lib/backend/api";
  import Icon from "@iconify/svelte";
  import { getHue, getSecondaryHue } from "$lib/util/color";
  import { Button } from "m3-svelte";

  const itemID = Number($page.params.itemID) || 0;

  const thumnailPrefix =
    import.meta.env.VITE_PUBLIC_API_URL + "/static/thumbnails";

  let item: Paths.GetShopItemsById.Responses.$200 | null = null;
  let stripe: any = null;
  let elements: any = null;
  let applepay = false;
  let loading = true;

  const loadPayment = async () => {
    const client = await apiClient;
    const { data: shopItem } = await client!.getShopItemsById(itemID);
    item = shopItem;

    try {
      const clientSecret = await client!
        ["postShopCreate-payment-intent"]({}, { shop_id: itemID })
        .then((res) => res.data.clientSecret);
      const { stripe: stripeObj, elements: elementsObj, paymentRequest, canMakePayment } =
        await initializeStripe(clientSecret, item);
      stripe = stripeObj;
      elements = elementsObj;
      if (!canMakePayment) {
        const paymentElement = elements.create("payment");
        paymentElement.mount("#payment-element");
        return;
      }
      paymentRequest.on("paymentmethod", async (ev: any) => {
        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: ev.paymentMethod.id,
          });
        if (confirmError) {
          ev.complete("fail");
          console.error(confirmError);
        } else {
          ev.complete("success");
          if (paymentIntent.status === "succeeded") {
            goto("/thankyou");
          }
        }
      });
      const prButton = elements.create("paymentRequestButton", {
        paymentRequest: paymentRequest,
      });
      prButton.mount("#payment-request-button");
      applepay = true;
    } catch (error) {
      console.error("Error loading payment:", error);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadPayment();
  });

  async function handleSubmit() {
    try {
      await handlePayment(stripe, elements);
    } catch (error) {
      console.error(error);
    }
  }
</script>

<div
  class="item-detail-container"
  style={`background: linear-gradient(30deg, ${getSecondaryHue(item?.id)}, transparent);`}
>
  <!-- Header -->
  <header class="detail-header">
    <div class="header-content">
      <Button variant="filled" onclick={() => goto("/shop")}>
        <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
      </Button>

      <h1 class="header-title">{item?.name || "Shop Item"}</h1>

      <div class="spacer"></div>
    </div>
  </header>

  <main class="detail-main">
    {#if item}
      <div class="detail-content-wrapper">
        <img
          src={`${thumnailPrefix}/${item.thumbnail}`}
          alt="item"
          class="item-thumbnail"
        />

        <div class="item-info">
          <h2 class="item-title">{item.name}</h2>
          <p class="item-description">{item.description}</p>

          {#if item.salePrice !== undefined && item.salePrice < item.price}
            <div class="price-row">
              <p class="original-price">
                ${item.price.toFixed(2)}
              </p>
              <p class="sale-price">
                ${item.salePrice.toFixed(2)}
              </p>
              <span class="sale-badge">
                Sale
              </span>
            </div>
          {:else}
            <p class="regular-price">
              ${item.price.toFixed(2)}
            </p>
          {/if}
        </div>

        <div class="payment-wrapper">
          <div id="payment-request-button" class="pr-button-el"></div>
          {#if !applepay}
            <form on:submit|preventDefault={handleSubmit} class="payment-form">
              <div id="payment-element"></div>
              {#if loading}
                <div class="spinner-wrapper">
                  <Spinner />
                </div>
              {:else}
                <div class="buy-button-wrapper">
                  <Button variant="filled" type="submit">Buy Now</Button>
                </div>
              {/if}
            </form>
          {/if}
        </div>
      </div>
    {:else}
      <div class="loading-wrapper">
        <Spinner />
      </div>
    {/if}
  </main>
</div>

<style>
  .item-detail-container {
    height: 100vh;
    overflow-y: auto;
    color: var(--m3c-on-background);
  }

  .detail-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem;
  }

  .header-content {
    max-width: 80rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-family: var(--m3-font); font-size: 1.375rem; line-height: 1.273; font-weight: 400;
    margin: 0;
    color: white;
  }

  .spacer {
    width: 3.5rem;
  }

  .detail-main {
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .detail-content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .item-thumbnail {
    height: 12rem;
    width: auto;
    margin-bottom: 1.5rem;
    border-radius: var(--m3-shape-large);
  }

  .item-info {
    text-align: center;
    margin-bottom: 2rem;
  }

  .item-title {
    font-family: var(--m3-font); font-size: 1.75rem; line-height: 1.286; font-weight: 400;
    margin-bottom: 0.5rem;
    color: var(--m3c-on-background);
  }

  .item-description {
    font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 400;
    color: var(--m3c-on-surface-variant);
    margin-bottom: 1rem;
    max-width: 30rem;
  }

  .price-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .original-price {
    font-family: var(--m3-font); font-size: 0.875rem; line-height: 1.429; font-weight: 400;
    color: var(--m3c-on-surface-variant);
    text-decoration: line-through;
    margin: 0;
  }

  .sale-price {
    font-family: var(--m3-font); font-size: 1.375rem; line-height: 1.273; font-weight: 400;
    color: #81c784;
    font-weight: bold;
    margin: 0;
  }

  .sale-badge {
    background-color: var(--m3c-error);
    color: var(--m3c-on-error);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--m3-shape-small);
    font-weight: bold;
  }

  .regular-price {
    font-family: var(--m3-font); font-size: 1.5rem; line-height: 1.333; font-weight: 400;
    color: var(--m3c-primary);
    font-weight: bold;
    margin: 0;
  }

  .payment-wrapper {
    width: 100%;
    max-width: 28rem;
  }

  .pr-button-el {
    margin-bottom: 1rem;
  }

  .payment-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .spinner-wrapper {
    display: flex;
    justify-content: center;
    padding: 1rem 0;
  }

  .buy-button-wrapper > :global(*) {
    width: 100%;
  }

  .loading-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }
</style>
