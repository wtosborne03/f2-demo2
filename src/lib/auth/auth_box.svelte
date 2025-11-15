<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "../../stores/authStore";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/util/toaster";
  import GoogleSignInButton from "../components/GoogleSignInButton.svelte";
  import { authDialog } from "../../stores/dialog";

  const { signIn, signUp, signOut, useSession } = authClient;
  const session = useSession();

  const customizeAvatar = async () => {
    await goto("/avatar", { replaceState: false });
    authDialog.set(false);
  };

  const goStats = async () => {
    await goto("/stats", { replaceState: false });
    authDialog.set(false);
  };

  // Attempt multiple sign-in flows for Google depending on available client methods.
  const signInWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/`; // or specify a path like '/auth-complete'
      const { data, error } = await signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      if (error) {
        toaster.error({
          title: "Google Sign-In Failed",
          description: error.message,
        });
        return;
      }
      // some clients return an url to redirect the browser to — handle that explicitly
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toaster.error({
        title: "Google Sign-In Failed",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };
  const goShop = async () => {
    await goto("/shop", { replaceState: false });
    authDialog.set(false);
  };
</script>

<div
  class="py-8 px-3 text-center h-full flex flex-col justify-center items-center gap-4"
>
  {#if $session.data?.user}
    <div
      class="flex flex-col justify-between h-full items-center text-xl w-full"
    >
      <div class="text-lg wrap-break-word">{$session.data?.user?.email}</div>
      <div
        class="flex flex-col items-center justify-start gap-4 w-full h-full py-10"
      >
        <button
          class="btn preset-filled w-full flex flex-row justify-between"
          on:click={customizeAvatar}
          >Customize Avatar <span class="text-2xl ml-2">💇‍♀️</span></button
        >
        <button
          class="btn preset-filled w-full flex flex-row justify-between"
          on:click={goShop}>Shop <span class="text-2xl ml-2">🛍️</span></button
        >
        <button
          class="btn preset-filled w-full flex flex-row justify-between"
          on:click={goStats}>Stats <span class="text-2xl ml-2">📊</span></button
        >
      </div>
      <button
        class="btn preset-filled-error-100-900 w-full"
        on:click={() => signOut()}
        >Sign Out <Icon icon="mdi:sign-out-variant" font-size="2rem" /></button
      >
    </div>
  {:else}
    <div class="px-2">
      <GoogleSignInButton onClick={signInWithGoogle} />
    </div>
  {/if}
</div>
