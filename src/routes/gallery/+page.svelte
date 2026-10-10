<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "../../stores/authStore";
    import Icon from "@iconify/svelte";
    import { Button, Card } from "m3-svelte";
    import UserImageGrid from "$lib/components/UserImageGrid.svelte";
    import GoogleSignInButton from "$lib/components/GoogleSignInButton.svelte";
    import SpotifySignInButton from "$lib/components/SpotifySignInButton.svelte";
    import AppleSignInButton from "$lib/components/AppleSignInButton.svelte";
    import TwitchSignInButton from "$lib/components/TwitchSignInButton.svelte";
    import { toaster } from "$lib/util/toaster";
    import { apiClient } from "$lib/backend/axios";
    import { browser } from "$app/environment";
    import Spinner from "$lib/components/spinner.svelte";
    import { dbClient } from "../../stores/apiClient";

    const session = authClient.useSession();
    const { signIn } = authClient;

    const initApi = async () => {
        const client = await apiClient;
        dbClient.set(client);
    };

    const signInWithGoogle = async () => {
        try {
            const redirectTo = `${window.location.origin}/gallery`;
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
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithSpotify = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "spotify",
                callbackURL: `${window.location.origin}/gallery`,
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
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithTwitch = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "twitch",
                callbackURL: `${window.location.origin}/gallery`,
            });
            if (error) {
                toaster.error({
                    title: "Twitch Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Twitch Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithApple = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "apple",
                callbackURL: `${window.location.origin}/gallery`,
            });
            if (error) {
                toaster.error({
                    title: "Apple Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Apple Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    if (browser) {
        initApi();
    }
</script>

<div class="gallery-container">
    <div class="back-btn-wrapper">
        <button
            type="button"
            class="btn btn-secondary flex items-center gap-2"
            onclick={() => goto("/")}
            id="back-to-home-btn"
        >
            <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
            <span>Back</span>
        </button>
    </div>

    <div class="gallery-header-row">
        <h1 class="gallery-title">Creation Gallery</h1>
        <span class="gallery-badge">ARCHIVE // 01 // CREATIONS</span>
    </div>

    {#if $session.isPending && browser && document.cookie.includes("better-auth")}
        <div class="spinner-wrapper">
            <Spinner />
        </div>
    {:else if $session.data?.user}
        <div class="grid-container w-full">
            <UserImageGrid userId={$session.data.user.id} />
        </div>
    {:else}
        <div class="auth-prompt-wrapper">
            <div class="auth-card">
                <div class="auth-card-content">
                    <div class="prompt-icon">🔒</div>
                    <div class="flex items-center gap-2 justify-center mb-1">
                        <span class="font-mono text-[10px] font-bold text-[#D02020] uppercase tracking-widest bg-white border border-[#121212] px-2 py-0.5">AUTH REQUIRED</span>
                    </div>
                    <h2 class="prompt-title">Sign In Required</h2>
                    <p class="prompt-desc">
                        Please log in to view your persistent history of
                        generated images across all past games.
                    </p>
                    <div class="signin-options">
                        <GoogleSignInButton onClick={signInWithGoogle} />
                        <AppleSignInButton onClick={signInWithApple} />
                        <TwitchSignInButton onClick={signInWithTwitch} />
                        <SpotifySignInButton onClick={signInWithSpotify} />
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .gallery-container {
        min-height: 100vh;
        height: 100%;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 2rem 1.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 52rem;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
        background-color: var(--b-canvas);
        color: var(--b-black);
    }

    .back-btn-wrapper {
        width: 100%;
        display: flex;
        justify-content: flex-start;
        margin-bottom: 1.5rem;
    }

    .gallery-header-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 1.5rem;
        gap: 0.5rem;
    }

    .gallery-title {
        font-family: var(--font-headline);
        font-size: clamp(2rem, 5vw, 2.75rem);
        line-height: 1.05;
        font-weight: 900;
        color: var(--b-black);
        text-transform: uppercase;
        letter-spacing: -0.03em;
        margin: 0;
    }

    .gallery-badge {
        font-family: var(--font-mono);
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.12em;
        color: var(--b-red);
        background-color: var(--b-white);
        border: 2px solid var(--b-black);
        padding: 0.2rem 0.75rem;
        box-shadow: 2px 2px 0px var(--b-black);
        text-transform: uppercase;
    }

    .grid-container {
        width: 100%;
    }

    .auth-prompt-wrapper {
        width: 100%;
        max-width: 28rem;
        margin-top: 1.5rem;
    }

    .auth-card {
        background-color: var(--b-white);
        border: var(--border-heavy);
        box-shadow: var(--shadow-lg);
    }

    .auth-card-content {
        padding: 2.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .prompt-icon {
        font-size: 2.75rem;
        margin-bottom: 0.75rem;
    }

    .prompt-title {
        font-family: var(--font-headline);
        font-size: 1.5rem;
        font-weight: 900;
        color: var(--b-black);
        text-transform: uppercase;
        letter-spacing: -0.02em;
        margin: 0.25rem 0 0.5rem 0;
    }

    .prompt-desc {
        font-family: var(--font-display);
        font-size: 0.95rem;
        color: #444444;
        line-height: 1.45;
        font-weight: 500;
        margin: 0 0 1.75rem 0;
    }

    .signin-options {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        width: 100%;
        align-items: center;
    }

    .signin-options :global(button) {
        width: 100%;
        max-width: 16rem;
    }

    .spinner-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4rem 0;
        width: 100%;
    }
</style>
