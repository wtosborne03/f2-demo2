<script lang="ts">
  import { onMount } from "svelte";
  import { get, writable, type Updater } from "svelte/store";
  import { supabase } from "../../supabaseClient";
  import { authStore } from "$lib/stores/authStore";
  import AvatarSelect from "./avatar_select.svelte";
  import { goto } from "$app/navigation";
  import { getDrawerStore, getToastStore } from "@skeletonlabs/skeleton";
  import { sendMessage } from "$lib";
  import { player_state } from "../../stores/player_state";
  import type { PlayerState } from "../../types/player_state";

  const drawerStore = getDrawerStore();
  const toastStore = getToastStore();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    } else {
      console.log("User signed out");
    }
  };

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
    } else {
      console.log("User signed in with Google:", data);
    }
  };

  let game_name = "";

  onMount(async () => {
    if (!$authStore.user) return;
    const { data, error } = await supabase
      .from("users")
      .select("game_name")
      .eq("id", $authStore.user?.id)
      .single();
    if (error) {
      console.error("Error fetching user:", error.message);
    } else {
      game_name = data.game_name;
    }
  });

  const updateUser = async () => {
    if (!$authStore.user) return;
    const { error } = await supabase
      .from("users")
      .update({ game_name })
      .eq("id", $authStore.user?.id);
    if (error) {
      console.error("Error updating user:", error.message);
    } else {
      if (get(player_state).screen != "index") {
        toastStore.trigger({
          message: "Name saved! (Reload page to see changes)",
        });
      } else {
        player_state.set({ ...get(player_state), name: game_name });
        toastStore.trigger({
          message: "Name saved!",
        });
      }
    }
  };

  const customizeAvatar = async () => {
    await goto("/avatar", { replaceState: false });
    drawerStore.close();
  };
</script>

<div
  class="p-8 text-center h-full flex flex-col justify-center items-center gap-4"
>
  {#if $authStore.user}
    <div class="flex flex-col justify-between h-full items-center">
      <div class="text-xl">{$authStore.user.email}</div>
      <div class="flex flex-col items-center justify-center gap-8">
        <label class="label">
          <span>Game Name</span>
          <input
            type="text"
            class="input"
            maxlength="10"
            name="Name"
            bind:value={game_name}
          />
          <button class="btn variant-filled-primary" on:click={updateUser}
            >Save Name</button
          >
        </label>
        <button class="btn variant-filled" on:click={customizeAvatar}
          >Customize Avatar <span class="text-2xl ml-2">💇‍♀️</span></button
        >
      </div>
      <button class="btn variant-filled-error" on:click={signOut}
        >Sign Out <i class="fa-solid fa-right-from-bracket ml-2"></i></button
      >
    </div>
  {:else}
    <div class="text-xl">Sign In</div>
    <button class="btn variant-filled-primary" on:click={loginWithGoogle}
      >Sign in with Google <i class="fa-brands fa-google ml-2"></i></button
    >
  {/if}
</div>
