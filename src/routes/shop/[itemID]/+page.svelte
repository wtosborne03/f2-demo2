<script lang="ts">
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import Spinner from "$lib/components/spinner.svelte";
  import {
    loadItem,
    createPaymentIntent,
    initializeStripe,
    handlePayment,
  } from "./paymentService";
  import { apiClient } from "$lib/backend/axios";
  import type { Paths } from "$lib/backend/api";

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
      // // load shop item / stripe
      const clientSecret = await client!
        ["postShopCreate-payment-intent"]({}, { shop_id: itemID })
        .then((res) => res.data.clientSecret);
      const { stripe, elements, paymentRequest, canMakePayment } =
        await initializeStripe(clientSecret, item);
      if (!canMakePayment) {
        const paymentElement = elements.create("payment");
        paymentElement.mount("#payment-element");
        return;
      }
      // Add a listener to handle the payment request
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
      // Mount apple/google pay button
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

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button
    class="btn preset-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/shop")}
  >
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  {#if item}
    <div class="p-2 flex-grow flex flex-col items-center justify-between">
      <div class="text-xl">{item.name}</div>

      <img
        src={`${thumnailPrefix}/${item.thumbnail}`}
        alt="item"
        class="h-1/3 w-auto my-2"
      />
      <div>
        <div class="text-lg">Description: {item.description}</div>
        <div class="text-lg">Price: ${item.price}</div>
      </div>

      <div id="payment-request-button" class="w-full"></div>
      {#if !applepay}
        <form on:submit|preventDefault={handleSubmit}>
          <div id="payment-element"></div>
          {#if loading}
            <Spinner />
          {:else}
            <button class="btn preset-filled w-full" type="submit">Buy</button>
          {/if}
        </form>
      {/if}
    </div>
  {:else}
    <div><Spinner /></div>
  {/if}
</div>
