import { get, writable } from 'svelte/store';
import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient, oneTapClient } from 'better-auth/client/plugins';
import { magicLink } from 'better-auth/plugins/magic-link';
import { withCapacitor } from 'better-auth-capacitor/client';

export const GOOGLE_CLIENT_ID = '780344995591-drqgn4dh7mrtir6p8bne8738qqg2ahtp.apps.googleusercontent.com';

export const authClient = createAuthClient(
    withCapacitor({
        baseURL: import.meta.env.VITE_PUBLIC_API_URL,
        fetchOptions: { credentials: 'include' },
        plugins: [
            oneTapClient({
                clientId: GOOGLE_CLIENT_ID,
                autoSelect: false,
                context: 'signin',
            }),
        ]
    }, {
        scheme: 'couchcup',
    })
);

/**
 * Submits a Google ID token (e.g. from native Android Credential Manager) to Better Auth.
 */
export async function authenticateWithGoogleIdToken(idToken: string) {
    const baseURL = import.meta.env.VITE_PUBLIC_API_URL || 'https://api.couchcup.tv:8443';
    const res = await fetch(`${baseURL}/api/auth/one-tap/callback`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            idToken,
            callbackURL: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
        }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to authenticate Google token');
    }
    const data = await res.json();
    if (typeof (authClient as any).getSession === 'function') {
        await (authClient as any).getSession();
    }
    return data;
}

/**
 * Hybrid Google Sign-In:
 * 1. Native Android: Uses Android Credential Manager via window.CouchCupAndroid.requestGoogleOneTap()
 * 2. Web: Uses Better Auth Google One Tap client (Google Identity Services)
 * 3. Fallback: Standard Better Auth social OAuth redirect
 */
export async function triggerGoogleSignIn(): Promise<void> {
    // 1. Native Android Credential Manager One Tap
    if (typeof window !== 'undefined' && (window as any).CouchCupAndroid?.hasNativeGoogleOneTap?.()) {
        try {
            await new Promise<void>((resolve, reject) => {
                let cleanup: () => void;
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error("Native One Tap request timed out"));
                }, 45000);

                const handleSuccess = async (e: Event) => {
                    cleanup();
                    const detail = (e as CustomEvent).detail;
                    if (detail?.idToken) {
                        try {
                            await authenticateWithGoogleIdToken(detail.idToken);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject(new Error("No ID token received from native One Tap"));
                    }
                };

                const handleError = (e: Event) => {
                    cleanup();
                    const detail = (e as CustomEvent).detail;
                    reject(new Error(detail?.error || "Native One Tap cancelled"));
                };

                cleanup = () => {
                    clearTimeout(timeoutId);
                    window.removeEventListener("nativeGoogleOneTapSuccess", handleSuccess);
                    window.removeEventListener("nativeGoogleOneTapError", handleError);
                };

                window.addEventListener("nativeGoogleOneTapSuccess", handleSuccess);
                window.addEventListener("nativeGoogleOneTapError", handleError);

                (window as any).CouchCupAndroid.requestGoogleOneTap();
            });
            return;
        } catch (nativeErr) {
            console.warn("Native Google One Tap dismissed or failed, attempting web fallback:", nativeErr);
        }
    }

    // 2. Web Google One Tap (Google Identity Services)
    if (typeof (authClient as any).oneTap === 'function') {
        try {
            await (authClient as any).oneTap();
            return;
        } catch (webOneTapErr) {
            console.warn("Web Google One Tap unavailable, attempting social redirect:", webOneTapErr);
        }
    }

    // 3. Fallback: standard social redirect
    const { data, error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    });
    if (error) {
        throw error;
    }
    if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
    }
}