<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { supabase } from "../../supabaseClient";
  import { authStore } from "$lib/stores/authStore";

  let shopItems: { [key: string]: any } = {};

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
    2: "Mouth",
    3: "Emotes",
  };

  onMount(async () => {
    if (!$authStore.user) {
      const { data, error } = await supabase
        .from("shop")
        .select("*, owned (user_id)");

      if (error) {
        console.error(error);
      } else {
        console.log(data);
        shopItems = Object.groupBy(data, ({ type }) => type);
      }
    } else {
      const { data, error } = await supabase
        .from("shop")
        .select("*, owned (user_id)")
        .eq("owned.user_id", $authStore.user!.id);
      if (error) {
        console.error(error);
      } else {
        console.log(data);
        shopItems = Object.groupBy(
          data.filter((item) => item.owned.length == 0),
          ({ type }) => type,
        );
      }
    }
  });
</script>

<div class="px-16 flex h-full w-screen flex-col justify-start items-center">
  <button class="btn variant-filled mb-4 mt-4" on:click={() => goto("/")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  {#each Object.keys(shopItems) as category}
    <div class="text-2xl mb-2 mt-6">{categories[category]}</div>
    <div class="w-screen overflow-x-scroll whitespace-nowrap">
      <div class="h-52 gap-4 flex flex-row items-stretch justify-normal px-8">
        {#each shopItems[category] as item}
          <div
            class="rounded-lg bg-slate-500 hover:bg-slate-600 cursor-pointer p-2 min-w-52 flex flex-col items-center justify-between"
            on:click={() => goto(`/shop/${item.id}`)}
          >
            <div class="text-xl">{item.name}</div>
            <img src={item.thumbnail} alt="item" class="h-32 w-auto" />
            <div class="text-lg">Price: ${item.price}</div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
