<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<div class="px-16 flex h-full flex-col justify-center items-center">
  <button class="btn variant-filled mb-10 mt-4" on:click={() => goto("/")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  <div class="text-2xl">Stats</div>
</div>
