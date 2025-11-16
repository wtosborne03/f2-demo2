<script lang="ts">
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/stores";
  import Spinner from "$lib/components/spinner.svelte";
  import { initializeStripe, handlePayment } from "./paymentService";
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

<div
  class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
>
  <!-- Header -->
  <header
    class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20"
  >
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <button class="btn preset-filled" on:click={() => goto("/shop")}>
        <i class="fa-solid fa-arrow-left mr-2"></i>Back
      </button>

      <h1 class="text-3xl font-bold text-white">{item?.name || "Shop Item"}</h1>

      <div class="w-32"></div>
      <!-- Spacer for centering -->
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    {#if item}
      <div class="flex flex-col items-center justify-center min-h-[60vh]">
        <img
          src={`${thumnailPrefix}/${item.thumbnail}`}
          alt="item"
          class="h-48 w-auto mb-6 rounded-lg shadow-lg"
        />

        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold mb-2">{item.name}</h2>
          <p class="text-lg text-gray-300 mb-2">{item.description}</p>
          <p class="text-xl font-semibold text-purple-400">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <div class="w-full max-w-md">
          <div id="payment-request-button" class="mb-4"></div>
          {#if !applepay}
            <form on:submit|preventDefault={handleSubmit} class="space-y-4">
              <div id="payment-element"></div>
              {#if loading}
                <div class="flex justify-center">
                  <Spinner />
                </div>
              {:else}
                <button class="btn preset-filled w-full" type="submit"
                  >Buy Now</button
                >
              {/if}
            </form>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    {/if}
  </main>
</div>
