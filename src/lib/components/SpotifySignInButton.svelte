<script lang="ts">
  export let onClick: () => {};
</script>

<button
  aria-label="Sign in with Google"
  class="flex items-center justify-center bg-black px-2 py-1.5 rounded-md pr-3"
  on:click={onClick}
>
  <i class="fa-brands fa-spotify text-2xl text-green-600 mr-1 fa-fw"></i>
  <span class="text-sm text-white tracking-wider">Sign in with Spotify</span>
</button>
