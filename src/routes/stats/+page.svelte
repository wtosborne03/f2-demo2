<script lang="ts">
  import { goto } from "$app/navigation";
  import { supabase } from "../../supabaseClient";

  import { authStore } from "$lib/stores/authStore";

  const age = $authStore.user?.created_at;
</script>

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button class="btn variant-filled mb-10 mt-4" on:click={() => goto("/")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >
  <div class="text-2xl mb-3">Stats</div>
  <table class="table w-full">
    <tbody>
      <tr>
        <th>Player Since</th>
        <td>{new Date(age).toDateString()}</td>
      </tr>
      <tr>
        <th>Wins</th>
        <td>0</td>
      </tr>
      <tr> </tr></tbody
    >
  </table>
</div>
