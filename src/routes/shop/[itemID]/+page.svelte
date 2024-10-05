<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase } from "../../../supabaseClient";

  import { page } from "$app/stores";
  $: console.log($page.params);

  const itemID = $page.params.itemID;

  let item: any = null;

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
    }
  });
</script>

<div class="px-16 flex h-full flex-col justify-center items-center">
  <button class="btn variant-filled mb-4 mt-4" on:click={() => goto("/shop")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  {#if item}
    <div class=" p-2 w-52 flex-grow flex flex-col items-center justify-between">
      <div class="text-xl">{item.name}</div>
      <div class="text-lg">Description: {item.description}</div>
      <div class="text-lg">Price: ${item.price}</div>
    </div>
  {:else}
    <div>Loading...</div>
  {/if}
</div>
