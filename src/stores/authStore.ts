import { get, writable } from 'svelte/store';
import { createAuthClient } from 'better-auth/svelte';
import { withCapacitor } from 'better-auth-capacitor/client';

export const GOOGLE_CLIENT_ID = '780344995591-drqgn4dh7mrtir6p8bne8738qqg2ahtp.apps.googleusercontent.com';

export const authClient = createAuthClient(
    withCapacitor({
        baseURL: import.meta.env.VITE_PUBLIC_API_URL,
        fetchOptions: { credentials: 'include' as const },
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
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('better-auth:session-update'));
    }
    return data;
}

/**
 * Hybrid Google Sign-In:
 * 1. Native Android: Uses Android Credential Manager modal via window.CouchCupAndroid.requestGoogleOneTap()
 * 2. Web & Fallback: Direct Better Auth social OAuth sign-in (redirect to Google)
 */
export async function triggerGoogleSignIn(callbackURL?: string): Promise<void> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTarget = callbackURL || (origin ? `${origin}/` : undefined);

    // 1. Native Android Credential Manager (in CouchCup Android app)
    if (typeof window !== 'undefined' && (window as any).CouchCupAndroid?.hasNativeGoogleOneTap?.()) {
        try {
            await new Promise<void>((resolve, reject) => {
                let cleanup: () => void;
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error("Native Google Sign-In timed out"));
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
                        reject(new Error("No ID token received from native Google Sign-In"));
                    }
                };

                const handleError = (e: Event) => {
                    cleanup();
                    const detail = (e as CustomEvent).detail;
                    reject(new Error(detail?.error || "Native Google Sign-In cancelled"));
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
            console.warn("Native Google Sign-In dismissed or failed, attempting standard OAuth:", nativeErr);
        }
    }

    // 2. Standard Google OAuth (Web & mobile browser fallback)
    const { data, error } = await authClient.signIn.social({
        provider: 'google',
        callbackURL: redirectTarget,
    });
    if (error) {
        throw error;
    }
    if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
    }
}