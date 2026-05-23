<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "../../stores/authStore";
    import Icon from "@iconify/svelte";
    import { toaster } from "$lib/util/toaster";
    import GoogleSignInButton from "./GoogleSignInButton.svelte";
    import { sideBarOpen } from "../../stores/sidebar";
    import SpotifySignInButton from "./SpotifySignInButton.svelte";
    import { Button } from "m3-svelte";

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

<div class="sidebar-content">
    {#if $session.data?.user}
        <div class="user-logged-in">
            <div class="user-email">
                {$session.data?.user?.email}
            </div>
            
            <div class="nav-buttons">
                <Button variant="tonal" onclick={customizeAvatar}>
                    Avatar <Icon icon="dashicons:admin-customizer" />
                </Button>
                <Button variant="tonal" onclick={goShop}>
                    Shop <Icon icon="material-symbols:shop-two-outline" />
                </Button>
                <Button variant="tonal" onclick={goStats}>
                    Stats <Icon icon="gridicons:stats" />
                </Button>
            </div>

            <div class="action-buttons">
                <Button variant="outlined" onclick={() => signOut()}>
                    Sign Out <Icon icon="mdi:sign-out-variant" />
                </Button>
            </div>
        </div>
    {:else}
        <div class="signin-options">
            <GoogleSignInButton onClick={signInWithGoogle} />
            <SpotifySignInButton onClick={signInWithSpotify} />
        </div>
    {/if}
</div>

<style>
    .sidebar-content {
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
    }

    .user-logged-in {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 1.5rem;
        align-items: center;
    }

    .user-email {
        font-family: var(--m3-font); font-size: 1rem; line-height: 1.5; font-weight: 500;
        color: var(--m3c-on-surface-variant);
        text-align: center;
        word-break: break-all;
    }

    .nav-buttons, .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    .nav-buttons > :global(*), .action-buttons > :global(*) {
        width: 100%;
    }

    .signin-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        max-width: 280px;
    }
</style>
