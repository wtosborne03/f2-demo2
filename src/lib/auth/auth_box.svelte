<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "../../stores/authStore";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/util/toaster";
  import GoogleSignInButton from "../components/GoogleSignInButton.svelte";

  const { signIn, signUp, signOut, useSession } = authClient;
  const session = useSession();

  let passkeyEmail = "";

  // Simple email validation helper
  const validateEmail = (email: string) => {
    const e = (email || "").trim();
    // Basic RFC-ish simple check: something@something.tld
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  };

  // reactive validity flag for UI (updates when passkeyEmail changes)
  let isEmailValid = false;
  $: isEmailValid = validateEmail(passkeyEmail);

  const login = async () => {
    const email = (passkeyEmail || "").trim();
    if (!email || !validateEmail(email)) {
      toaster.error({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      });
      return;
    }
  };

  const customizeAvatar = async () => {
    await goto("/avatar", { replaceState: false });
    //drawerStore.close();
  };

  const goStats = async () => {
    await goto("/stats", { replaceState: false });
    // drawerStore.close();
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
    // drawerStore.close();
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
        class="btn preset-filled-error-500 w-full"
        on:click={() => signOut()}
        >Sign Out <i class="fa-solid fa-right-from-bracket ml-2"></i></button
      >
    </div>
  {:else}
    <div class="w-full">
      <GoogleSignInButton onClick={signInWithGoogle} />
    </div>
  {/if}
</div>
