<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase } from "../../../supabaseClient";
  import { loadStripe } from "@stripe/stripe-js";

  import { page } from "$app/stores";
  import Spinner from "../../../components/spinner.svelte";

  $: console.log($page.params);

  const itemID = $page.params.itemID;

  let item: any = null;
  let clientSecret: string | null = null;
  let stripe: any = null;
  let elements: any = null;
  let paymentRequest: any = null;

  onMount(async () => {
    console.log(itemID);
    const { data, error } = await supabase
      .from("shop")
      .select("*")
      .eq("id", itemID)
      .single();
    if (error) {
      console.error(error);
    } else {
      console.log(data);
      item = data;

      // Load Stripe
      stripe = await loadStripe(
        "pk_live_51OH7QBEaNbJFWzSSzsO1wsvWMFzITvS3qn195uDKwSiDQ6Y85Vm9yCMfzWMnpmcMTXhHWLalN3Xx49Bv7H4FyOzF00FHnrOF7v",
      );

      // Create Payment Intent
      const response = await fetch(
        "https://lil-feed.com:5002/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: item.price * 100 }), // Amount in cents
        },
      );

      const { clientSecret: secret } = await response.json();
      clientSecret = secret;

      if (stripe && clientSecret) {
        elements = stripe.elements({ clientSecret });

        // Create a payment request
        paymentRequest = stripe.paymentRequest({
          country: "US",
          currency: "usd",
          total: {
            label: item.name,
            amount: item.price * 100, // Amount in cents
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        // Check if the payment request is available
        const result = await paymentRequest.canMakePayment();
        if (result) {
          const prButton = elements.create("paymentRequestButton", {
            paymentRequest: paymentRequest,
          });
          prButton.mount("#payment-request-button");
        } else {
          // Fallback to other payment methods if Apple Pay is not available
          const paymentElement = elements.create("payment");
          paymentElement.mount("#payment-element");
        }
      }
    }
  });

  async function handleSubmit() {
    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "https://your-website.com/confirmation",
      },
    });

    if (error) {
      console.error(error);
    }
  }
</script>

<div class="px-16 flex h-full flex-col justify-center items-center">
  <button class="btn variant-filled mb-4 mt-4" on:click={() => goto("/shop")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  {#if item}
    <div class=" p-2 w-72 flex-grow flex flex-col items-center justify-between">
      <div class="text-xl">{item.name}</div>
      <div class="text-lg">Description: {item.description}</div>
      <div class="text-lg">Price: ${item.price}</div>
      <form on:submit|preventDefault={handleSubmit}>
        <div id="payment-request-button"></div>
        <div id="payment-element"></div>
        <button class="btn variant-filled w-full" type="submit">Buy</button>
      </form>
    </div>
  {:else}
    <div><Spinner /></div>
  {/if}
</div>
