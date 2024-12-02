<script>
  import { page } from "$app/stores";

  $: errorMessage = $page.url.searchParams.get("message");
</script>

<h1>Error</h1>
<p>{errorMessage}</p>
