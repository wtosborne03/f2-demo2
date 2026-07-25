<script lang="ts">
  export let element: HTMLElement;

  export let title: string = "";
  export let description: string = "";
  export let age: number = 0;
  export let job: string = "";
  export let image: string | undefined = undefined;
</script>

<div
  class="w-full h-full p-4 absolute cursor-grab ease-in-out rounded-xl touch-none select-none border border-black bg-white overflow-hidden"
  bind:this={element}
>
  {#key image}
    {#if image}
      <img
        class="w-full h-full rounded-xl object-cover"
        src={image}
        alt={title}
      />
    {/if}
  {/key}
  <div
    class="absolute inset-0 bg-gradient-to-t from-black/80 via-white/0 rounded-b-xl text-white"
  ></div>
  <div class="p-4 absolute bottom-10 left-0 w-full flex justify-center">
    <div class="flex items-center flex-col">
      <h3 class="text-4xl font-semibold pb-4">{title}</h3>
      <p class="text-2xl">{description}</p>
    </div>
  </div>
</div>
