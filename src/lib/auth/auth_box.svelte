<script lang="ts">
  import { supabase } from "../config/supabaseClient";
  import { authStore } from "../../stores/authStore";
  import { goto } from "$app/navigation";
  import { getDrawerStore, getToastStore } from "@skeletonlabs/skeleton";

  import GoogleSignInButton from "$lib/components/GoogleSignInButton.svelte";
  import AppleSignInButton from "$lib/components/AppleSignInButton.svelte";

  const drawerStore = getDrawerStore();
  const toastStore = getToastStore();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      toastStore.trigger({
        message: "Error signing out: " + error.message,
      });
    } else {
      console.log("User signed out");
    }
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
    } else {
      console.log("User signed in with Google:", data);
    }
  };

  const loginWithApple = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
    });
    if (error) {
      console.error("Error signing in with Apple:", error.message);
    } else {
      console.log("User signed in with Apple:", data);
    }
  };

  const customizeAvatar = async () => {
    await goto("/avatar", { replaceState: false });
    drawerStore.close();
  };

  const goStats = async () => {
    await goto("/stats", { replaceState: false });
    drawerStore.close();
  };
  const goShop = async () => {
    await goto("/shop", { replaceState: false });
    drawerStore.close();
  };
</script>

<div
  class="py-8 px-3 text-center h-full flex flex-col justify-center items-center gap-4"
>
  {#if $authStore.user}
    <div
      class="flex flex-col justify-between h-full items-center text-xl w-full"
    >
      <div class="text-lg break-words">{$authStore.user.email}</div>
      <div
        class="flex flex-col items-center justify-start gap-4 w-full h-full py-10"
      >
        <button
          class="btn variant-filled w-full flex flex-row justify-between"
          on:click={customizeAvatar}
          >Customize Avatar <span class="text-2xl ml-2">💇‍♀️</span></button
        >
        <button
          class="btn variant-filled w-full flex flex-row justify-between"
          on:click={goShop}>Shop <span class="text-2xl ml-2">🛍️</span></button
        >
        <button
          class="btn variant-filled w-full flex flex-row justify-between"
          on:click={goStats}>Stats <span class="text-2xl ml-2">📊</span></button
        >
      </div>
      <button class="btn variant-filled-error w-full" on:click={signOut}
        >Sign Out <i class="fa-solid fa-right-from-bracket ml-2"></i></button
      >
    </div>
  {:else}
    <div class="text-xl">Sign In</div>
    <GoogleSignInButton onClick={loginWithGoogle} />
    <AppleSignInButton onClick={loginWithApple} />
  {/if}
</div>
