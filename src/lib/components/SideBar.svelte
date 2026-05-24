<script lang="ts">
  import { goto } from "$app/navigation";
  import { authClient } from "../../stores/authStore";
  import { toaster } from "$lib/util/toaster";
  import GoogleSignInButton from "./GoogleSignInButton.svelte";
  import { sideBarOpen } from "../../stores/sidebar";
  import SpotifySignInButton from "./SpotifySignInButton.svelte";
  import { NavigationRail, NavigationRailItem } from "m3-svelte";
  import { page } from "$app/state";

  import iconPerson from "@ktibow/iconset-material-symbols/person";
  import iconStorefront from "@ktibow/iconset-material-symbols/storefront";
  import iconLeaderboard from "@ktibow/iconset-material-symbols/leaderboard";
  import iconLogout from "@ktibow/iconset-material-symbols/logout";

  const { signIn, signOut, useSession } = authClient;
  const session = useSession();

  const customizeAvatar = async () => {
    await goto("/avatar", { replaceState: false });
    sideBarOpen.set(false);
  };

  const goStats = async () => {
    await goto("/stats", { replaceState: false });
    sideBarOpen.set(false);
  };

  const signInWithGoogle = async () => {
    try {
      const redirectTo = `${window.location.origin}/`;
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

  const signInWithSpotify = async () => {
    try {
      const { data, error } = await signIn.social({
        provider: "spotify",
        callbackURL: `${window.location.origin}/`,
      });
      if (error) {
        toaster.error({
          title: "Spotify Sign-In Failed",
          description: error.message,
        });
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toaster.error({
        title: "Spotify Sign-In Failed",
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const goShop = async () => {
    await goto("/shop", { replaceState: false });
    sideBarOpen.set(false);
  };
</script>

<div class="rail-wrapper" class:open={$sideBarOpen}>
  <NavigationRail bind:open={$sideBarOpen} collapse="full" modal>
    {#if $session.data?.user}
      <div class="user-info">
        <span class="user-email">{$session.data?.user?.email}</span>
      </div>

      <NavigationRailItem
        label="Avatar"
        icon={iconPerson}
        active={page.url.pathname === "/avatar"}
        onclick={customizeAvatar}
      />
      <NavigationRailItem
        label="Shop"
        icon={iconStorefront}
        active={page.url.pathname === "/shop"}
        onclick={goShop}
      />
      <NavigationRailItem
        label="Stats"
        icon={iconLeaderboard}
        active={page.url.pathname === "/stats"}
        onclick={goStats}
      />

      <div class="spacer"></div>

      <NavigationRailItem
        label="Sign Out"
        icon={iconLogout}
        onclick={() => signOut()}
      />
    {:else}
      <div class="signin-info">
        <span class="signin-title">Sign In</span>
      </div>
      <div class="signin-options">
        <GoogleSignInButton onClick={signInWithGoogle} />
        <SpotifySignInButton onClick={signInWithSpotify} />
      </div>
    {/if}
  </NavigationRail>
</div>

<style>
  .rail-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    z-index: 60;
    width: 0;
    transition: width 300ms cubic-bezier(0.2, 0, 0, 1);
  }

  .rail-wrapper.open {
    width: 220px;
  }

  /* Force only the outer navigation rail container and background to show correctly */
  .rail-wrapper > :global(.m3-container) {
    width: 100% !important;
    height: 100% !important;
  }

  .rail-wrapper :global(.rail) {
    background-color: var(--m3c-surface-container) !important;
    width: 100% !important;
    height: 100% !important;
    visibility: visible !important;
  }

  /* Hide default toggle button from M3 NavigationRail */
  :global(.rail-wrapper .toggle) {
    display: none !important;
  }

  .rail-wrapper :global(.rail.open .items) {
    opacity: 1 !important;
    width: 100% !important;
    height: 100% !important;
  }

  .user-info,
  .signin-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 0.5rem 0.5rem 0.5rem;
    width: 100%;
    box-sizing: border-box;
  }

  .user-email {
    font-family: var(--m3-font);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--m3c-on-surface-variant);
    text-align: center;
    word-break: break-all;
    max-width: 180px;
  }

  .signin-title {
    font-family: var(--m3-font);
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--m3c-on-surface);
  }

  .spacer {
    flex-grow: 1;
  }

  .signin-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    align-items: center;
  }

  .signin-options :global(button) {
    width: 100%;
    max-width: 180px;
  }
</style>
