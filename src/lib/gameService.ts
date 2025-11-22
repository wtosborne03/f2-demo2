import { player_state } from '../stores/player_state';
import { get } from 'svelte/store';
import { authClient } from '../stores/authStore';
import GameClient from './wsapi/gameClient';
import type { JoinRoomResponse, PlayerState } from './wsapi/game';
import { apiClient } from './backend/axios';
import { toaster } from './util/toaster';

let r_code = "";
let r_name = "";
let playing = false;
const session = authClient.useSession();
export const gameClient = new GameClient({ url: import.meta.env.VITE_PUBLIC_WS_API_URL, role: 'PLAYER', autoReconnect: true, autoRejoin: true });
gameClient.connect();

gameClient.on('joinRoomResponse', (data) => {
    if (!data) return;
    joinedGameCallback(data);
});

gameClient.on('playerUpdate', (data) => {
    if (!data) return;
    updateState(data);
});

gameClient.on('error', (data) => {
    if (data?.code === 410) {
        roomEnded();
        return;
    }
    toaster.error({ title: "Error", description: data?.message || "An unknown error occurred." });
    console.error("GameClient error:", data?.message);
});

/**
 * Join a room with the given code and name.
 * @param code - Room code
 * @param name - Player name
 * @returns 
 */
export function joinRoom(code: string, name: string) {
    if (!code || !name) {
        console.error("Invalid room code or name.");
        return;
    }

    localStorage.setItem("name", name);
    localStorage.setItem("code", code);
    r_code = code;
    r_name = name;
    gameClient.joinRoom(code, name);
    // send as protobuf client message (no wait)
    //sendMessageAndWaitForResponse({ type: 'joinRoom', data: { roomId: code, name, userID: session.get().data?.user?.id } }).catch(() => { });
}

export function reJoinRoom() {
    gameClient.joinRoom(r_code, r_name);
    //sendMessageAndWaitForResponse({ type: 'joinRoom', data: { roomId: r_code, name: r_name } }).catch(() => { });
}

/**
 * Callback function during game join, initializes player state.
 * @returns 
 */
export const joinedGameCallback = async (res: JoinRoomResponse) => {
    //=const { user } = get(authStore);
    if (res.snapshot) {
        updateState(res.snapshot);
    }
    if (session.get().data?.user) {
        playing = true;
        try {
            const client = await apiClient;
            const me = await client?.getUsersMe()

            gameClient.sendPlayerInput({
                payload: {
                    $case: 'avatarUpdate',
                    avatarUpdate: {
                        avatar: {
                            eyes: me?.data.avatar_eyes || 0,
                            hair: me?.data.avatar_hair || 0,
                            mouth: me?.data.avatar_mouth || 0,
                            emote: me?.data.avatar_emote || 0,
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Failed to update avatar on join:", error);
        }
    }
};

export function updateState(state: PlayerState) {
    console.log("Updating player state:", state);
    try {
        player_state.set({ ...player_state, ...state, pageData: JSON.parse(state.pageDataJson || '{}') });
    } catch (error) {
        console.error("Failed to update player state:", error);
    }
}

/**
 * Reset state if room was destroyed
 */
export function roomEnded() {
    let p_player = get(player_state);
    playing = false;
    p_player.screen = "room_ended";
    player_state.set(p_player);
}

export function getName() {
    return r_name;
}

export function getPlaying() {
    return playing;
}

/**
 * Get the current time from the server.
 * @returns {Promise<number>} - The current time in milliseconds since the epoch.
 */
export async function getTime() {
    try {
        const response = await gameClient.getTime();
        if (response?.serverTime) {
            return response.serverTime.getTime();
        }
        if (response?.clientTimestamp) {
            return response.clientTimestamp;
        }
        return Date.now();
    } catch (error) {
        console.error("Failed to get time:", error);
        return Date.now();
    }
}