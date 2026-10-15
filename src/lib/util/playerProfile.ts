import { browser } from "$app/environment";
import { get } from "svelte/store";
import { authClient } from "../../stores/authStore";
import { apiClient } from "$lib/backend/axios";

export interface AvatarData {
  selfieUrl?: string;
  expressions?: {
    neutral_open?: string;
    neutral_closed?: string;
    happy_open?: string;
    happy_closed?: string;
    sad_open?: string;
    sad_closed?: string;
    surprised_open?: string;
    surprised_closed?: string;
  };
  gender?: string;
  facialDescription?: string;
  catchphraseUrl?: string;
}

export interface PlayerProfile {
  name: string;
  userId: string;
  avatar?: AvatarData;
}

/**
 * Resolves the player's profile (name, userId, and avatar) from either:
 * 1. The authenticated account (apiClient.getUsersMe), if logged in or logging in.
 * 2. Guest localStorage fallbacks.
 *
 * Guarantees a single source of truth across manual join, autoJoinCasting, and rejoining.
 */
export async function resolvePlayerProfile(fallbackName?: string): Promise<PlayerProfile> {
  if (!browser) {
    return {
      name: fallbackName || "Player",
      userId: "temp_" + crypto.randomUUID(),
    };
  }

  const sessionStore = authClient.useSession();
  let sessionState = get(sessionStore);

  // If the auth session is currently pending (e.g. freshly mounted webview),
  // wait up to 400ms for it to resolve so we don't prematurely fall back to guest.
  if (sessionState.isPending) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve();
      }, 400);

      const unsubscribe = sessionStore.subscribe((curr) => {
        if (!curr.isPending) {
          clearTimeout(timeout);
          sessionState = curr;
          unsubscribe();
          resolve();
        }
      });
    });
  }

  const user = sessionState.data?.user;

  if (user) {
    let profileName = (user.name || "").trim().substring(0, 10);
    let avatar: AvatarData | undefined = undefined;

    try {
      const client = await apiClient;
      if (client) {
        const { data: me } = await client.getUsersMe();
        if (me) {
          if (me.game_name && me.game_name.trim()) {
            profileName = me.game_name.trim().substring(0, 10);
          } else if (me.name && me.name.trim()) {
            profileName = me.name.trim().substring(0, 10);
          }

          if (me.avatar_selfie) {
            avatar = {
              selfieUrl: me.avatar_selfie,
              expressions: me.avatar_neutral_open
                ? {
                    neutral_open: me.avatar_neutral_open || undefined,
                    neutral_closed: me.avatar_neutral_closed || undefined,
                    happy_open: me.avatar_happy_open || undefined,
                    happy_closed: me.avatar_happy_closed || undefined,
                    sad_open: me.avatar_sad_open || undefined,
                    sad_closed: me.avatar_sad_closed || undefined,
                    surprised_open: me.avatar_surprised_open || undefined,
                    surprised_closed: me.avatar_surprised_closed || undefined,
                  }
                : undefined,
              gender: me.avatar_gender || undefined,
              facialDescription: (me as any).avatar_facial_description || undefined,
              catchphraseUrl: (me as any).avatar_catchphrase || undefined,
            };

            // Mirror to localStorage for offline / fast caching
            localStorage.setItem("temp_selfie", me.avatar_selfie);
            if (avatar.expressions) {
              localStorage.setItem("temp_expressions", JSON.stringify(avatar.expressions));
            }
            if (avatar.gender) {
              localStorage.setItem("temp_gender", avatar.gender);
            }
            if (avatar.facialDescription) {
              localStorage.setItem("temp_facial_description", avatar.facialDescription);
            }
          }
        }
      }
    } catch (e) {
      console.warn("[playerProfile] Failed fetching profile from backend, falling back to local cache:", e);
    }

    if (!avatar) {
      avatar = readAvatarFromLocalStorage();
    }

    const finalName = profileName || localStorage.getItem("name") || fallbackName || "Player";
    localStorage.setItem("name", finalName);

    return {
      name: finalName,
      userId: user.id,
      avatar,
    };
  }

  // Guest flow: Read from localStorage
  let guestName = localStorage.getItem("name") || fallbackName || "";
  let guestUserId = localStorage.getItem("temp_user_id");
  if (!guestUserId) {
    guestUserId = "temp_" + crypto.randomUUID();
    localStorage.setItem("temp_user_id", guestUserId);
  }

  const guestAvatar = readAvatarFromLocalStorage();

  return {
    name: guestName,
    userId: guestUserId,
    avatar: guestAvatar,
  };
}

function readAvatarFromLocalStorage(): AvatarData | undefined {
  if (!browser) return undefined;
  const selfie = localStorage.getItem("temp_selfie");
  if (!selfie) return undefined;

  let expressions: any = undefined;
  const exprStr = localStorage.getItem("temp_expressions");
  if (exprStr) {
    try {
      expressions = JSON.parse(exprStr);
    } catch {}
  }

  return {
    selfieUrl: selfie,
    expressions,
    gender: localStorage.getItem("temp_gender") || undefined,
    facialDescription: localStorage.getItem("temp_facial_description") || undefined,
    catchphraseUrl: localStorage.getItem("temp_catchphrase") || undefined,
  };
}
