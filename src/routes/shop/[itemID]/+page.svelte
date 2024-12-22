<script lang="ts">
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { supabase } from "../../../supabaseClient";
  import { loadStripe } from "@stripe/stripe-js";

  import { page } from "$app/stores";
  import Spinner from "../../../components/spinner.svelte";
  import { authStore } from "$lib/stores/authStore";

  $: console.log($page.params);

  const itemID = $page.params.itemID;

  let item: any = null;
  let clientSecret: string | null = null;
  let stripe: any = null;
  let elements: any = null;
  let paymentRequest: any = null;
  let applepay = false;
  let loading = true;

  let isMounted = false;

  const loadItem = async () => {
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

      if (!$authStore.user) {
        loading = false;
        return;
      }

      // Load Stripe
      stripe = await loadStripe(
        "pk_live_51OH7QBEaNbJFWzSSzsO1wsvWMFzITvS3qn195uDKwSiDQ6Y85Vm9yCMfzWMnpmcMTXhHWLalN3Xx49Bv7H4FyOzF00FHnrOF7v",
      );

      // Create Payment Intent
      const response = await fetch(
        "https://lil-feed.com:5004/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shop_id: item.id,
            user_id: $authStore.user!.id,
          }), // Amount in cents
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
                // Handle successful payment
                goto("/thankyou");
              }
            }
          });
          if (!isMounted) {
            return;
          }

          const prButton = elements.create("paymentRequestButton", {
            paymentRequest: paymentRequest,
          });
          prButton.mount("#payment-request-button");
          applepay = true;
        } else {
          // Fallback to other payment methods if Apple Pay is not available
          const paymentElement = elements.create("payment");
          paymentElement.mount("#payment-element");
        }
        loading = false;
      }
    }
  };

  onMount(() => {
    loadItem();
    isMounted = true;

    return () => {
      isMounted = false;
    };
  });

  async function handleSubmit() {
    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "https://play.couchcup.tv/thankyou",
      },
    });

    if (error) {
      console.error(error);
    }
  }
</script>

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button
    class="btn variant-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/shop")}
  >
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  {#if item}
    <div class=" p-2 flex-grow flex flex-col items-center justify-between">
      <div class="text-xl">{item.name}</div>

      <img src={item.thumbnail} alt="item" class="h-1/3 w-auto my-2" />
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
            <button class="btn variant-filled w-full" type="submit">Buy</button>
          {/if}
        </form>
      {/if}
    </div>
  {:else}
    <div><Spinner /></div>
  {/if}
</div>
