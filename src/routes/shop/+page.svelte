<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase } from "../../supabaseClient";

  let shopItems: { [key: string]: any } = {};

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
  };

  onMount(async () => {
    const { data, error } = await supabase.from("shop").select("*");
    if (error) {
      console.error(error);
    } else {
      console.log(data);
      shopItems = Object.groupBy(data, ({ type }) => type);
    }
  });
</script>

<div class="px-16 flex h-full w-screen flex-col justify-center items-center">
  <button class="btn variant-filled mb-4 mt-4" on:click={() => goto("/")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  {#each Object.keys(shopItems) as category}
    <div class="text-2xl mb-2 mt-6">{categories[category]}</div>
    <div class="w-screen overflow-x-scroll">
      <div class="h-52 gap-4 scroll-auto flex flex-row w-96">
        {#each shopItems[category] as item}
          <div
            class="rounded-lg bg-slate-500 p-2 w-52 flex flex-col justify-between"
            on:click={() => goto(`/shop/${item.id}`)}
          >
            <div class="text-xl">{item.name}</div>
            <div class="text-lg">Price: ${item.price}</div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
