import { player_state } from '../stores/player_state';
import { authStore } from '../stores/authStore';
import { supabase } from './config/supabaseClient';
import { sendMessage, sendMessageAndWaitForResponse, sendRawMessage } from './webSocketService';
import type { Avatar, PlayerState } from '../types/player_state';
import { get } from 'svelte/store';

let r_code = "";
let r_name = "";
let playing = false;

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
    sendRawMessage({
        type: "joinRoom",
        data: { roomId: code, name, userID: get(authStore).user?.id },
    });
}

export function reJoinRoom() {
    sendRawMessage({
        type: "joinRoom",
        data: { roomId: r_code, name: r_name, userID: get(authStore).user?.id },
    });
}

/**
 * Callback function during game join, initializes player state.
 * @returns 
 */
export const joinedGameCallback = async () => {
    const { user } = get(authStore);
    if (user) {
        console.log("Joined game callback");
        playing = true;

        // Fetch avatar data and send it
        const { error, data } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (error) {
            console.error(error);
            return;
        }

        const avatar: Avatar = {
            eyes: data.avatar_eyes || 0,
            hair: data.avatar_hair || 0,
            mouth: data.avatar_mouth || 0,
            emote: data.avatar_emote || 0,
        };
        sendMessage({
            type: "avatar_update",
            data: { avatar },
        });
    }
};

export function updateState(state: PlayerState) {
    try {
        player_state.set(state);
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
        const response: any = await sendMessageAndWaitForResponse({ type: "getTime" });
        return response['time'];
    } catch (error) {
        console.error("Failed to get time:", error);
    }
}