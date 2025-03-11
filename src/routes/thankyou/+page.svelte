<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button
    class="btn variant-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/")}
  >
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  <div class="text-2xl mb-3">Thank you for you purchase!</div>
</div>
