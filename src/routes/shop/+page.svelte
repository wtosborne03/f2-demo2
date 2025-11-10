<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  let shopItems: { [key: string]: any } = {};

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
    2: "Mouth",
    3: "Emotes",
  };

  // onMount(async () => {
  //   const query = supabase.from("shop").select("*, owned (user_id)");

  //   const { data, error } = $authStore.user
  //     ? await query.eq("owned.user_id", $authStore.user!.id)
  //     : await query;

  //   if (error) {
  //     console.error(error);
  //   } else {
  //     shopItems = Object.groupBy(
  //       $authStore.user ? data.filter((item) => item.owned.length == 0) : data,
  //       ({ type }) => type,
  //     );
  //   }
  // });
</script>

<div
  class="px-0 py-4 max-w-screen-xl mx-auto flex flex-col items-center transition-all"
>
  <div class="px-8">
    <button
      class="btn preset-filled mb-6 mt-4 w-full"
      on:click={() => goto("/")}
    >
      <i class="fa-solid fa-arrow-left mr-2"></i>Back
    </button>
  </div>
  {#each Object.keys(shopItems) as category}
    <div class="text-3xl font-bold mb-4 mt-6 w-full flex flex-row items-center">
      <span class="w-full bg-slate-400 h-1 m-3"></span>{categories[
        category
      ]}<span class="w-full bg-slate-400 h-1 m-3"></span>
    </div>
    <div class="w-full overflow-x-auto whitespace-nowrap">
      <div class="flex space-x-4 mx-4">
        {#each shopItems[category] as item}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            class="transition-all rounded-lg shadow-xl cursor-pointer p-2 min-w-52 flex flex-col items-center justify-between relative"
            on:click={() => goto(`/shop/${item.id}`)}
          >
            <div
              class="absolute transition-all duration-500 w-full h-full rounded-xl inset-0 bg-gradient-to-tr from-purple-600 to-blue-600 hover:from-slate-600 hover:to-blue-600 opacity-35"
            ></div>
            <div
              class="z-10 pointer-events-none w-full h-full flex flex-col items-center justify-between"
            >
              <div class="text-xl font-semibold mb-1">{item.name}</div>
              <img
                src={item.thumbnail}
                alt="item"
                class="h-32 w-auto object-cover mb-1"
              />
              <div class="text-lg text-gray-200">Price: ${item.price}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>
