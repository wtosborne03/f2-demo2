<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase } from "../../../supabaseClient";

  import { page } from "$app/stores";
  import Spinner from "../../../components/spinner.svelte";
  import { authStore } from "$lib/stores/authStore";
  import { loadScript, type PayPalNamespace } from "@paypal/paypal-js";

  const itemID = $page.params.itemID;

  let item: any = null;
  let loading = true;

  let paypal: PayPalNamespace;

  const loadItem = async () => {
    try {
      paypal = (await loadScript({
        clientId:
          "AU0DljOTuf53hsjxETEQoboU_2b5X9vynte27S_fNXNZIznu2pSxXaNcpEQHpLo8RGsAsA4fdaYF5OcF",
      })) as any;
    } catch (error) {
      console.error("failed to load the PayPal JS SDK script", error);
    }
    const { data, error } = await supabase
      .from("shop")
      .select("*")
      .eq("id", itemID)
      .single();
    if (error) {
      console.error(error);
    } else {
      item = data;

      if ($authStore.user) {
        loading = false;
        initPayPalButton();
      }
    }
  };

  const initPayPalButton = () => {
    try {
      paypal.Buttons!({
        createOrder: async (data, actions) => {
          const res = await fetch(
            "https://lil-feed.com/create-payment-intent",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: "",
                shop_id: "",
              }),
            },
          );
          const order = await res.json();
          return order.id;
        },
        onApprove: async (data, actions) => {
          const order = await actions.order!.capture();
          console.log("Order successfully captured:", order);
          goto("/thankyou");
        },
        onError: (err) => {
          console.error("PayPal Checkout Error:", err);
        },
      }).render("#paypal-button-container");
    } catch (error) {
      console.error(error);
    }
  };

  onMount(() => {
    loadItem();
  });
</script>

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button
    class="btn variant-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/shop")}
  >
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  {#if item}
    <div class="p-2 flex-grow flex flex-col items-center justify-between">
      <div class="text-xl">{item.name}</div>
      <img src={item.thumbnail} alt="item" class="h-1/3 w-auto my-2" />
      <div>
        <div class="text-lg">Description: {item.description}</div>
        <div class="text-lg">Price: ${item.price}</div>
      </div>

      <div id="paypal-button-container" class="w-full mt-4"></div>
      {#if loading}
        <Spinner />
      {/if}
    </div>
  {:else}
    <div><Spinner /></div>
  {/if}
</div>
