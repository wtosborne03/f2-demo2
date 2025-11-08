<script lang="ts">
  import { authStore } from "../../stores/authStore";
  import { goto } from "$app/navigation";
  import { authClient } from "../../stores/authStore";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/util/toaster";

  const { signIn, signUp, signOut } = authClient;

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

    const { data, error } = await signIn.magicLink({ email });
    if (error) {
      toaster.error({
        title: "Login Failed",
        description: error.message,
      });
    } else {
      toaster.success({
        title: "Login Email Sent",
        description: "Please check your email to complete login.",
      });
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
  const goShop = async () => {
    await goto("/shop", { replaceState: false });
    // drawerStore.close();
  };
</script>

<div
  class="py-8 px-3 text-center h-full flex flex-col justify-center items-center gap-4"
>
  {#if $authStore.user}
    <div
      class="flex flex-col justify-between h-full items-center text-xl w-full"
    >
      <div class="text-lg wrap-break-word">{$authStore.user.email}</div>
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
    <input
      type="email"
      bind:value={passkeyEmail}
      placeholder="Email"
      class="input w-full p-4"
      aria-invalid={!isEmailValid}
    />
    <div class="h-2 flex items-center justify-center">
      {#if passkeyEmail && !isEmailValid}
        <div class="text-sm text-red-600 text-left w-full">
          Please enter a valid email address.
        </div>
      {/if}
    </div>
    <div class="flex flex-col gap-2 w-full">
      <button
        class="btn preset-filled w-full p-4"
        on:click={login}
        disabled={!isEmailValid}
        aria-disabled={!isEmailValid}
        >Send Login Link <Icon font-size="1.75rem" icon="mdi:sign-in-variant" />
      </button>
    </div>
  {/if}
</div>
