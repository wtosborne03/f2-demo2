import Game from '../pages/game.svelte';
import GameAdmin from '../pages/game_admin.svelte';
import RoomEnded from '../pages/room_ended.svelte';
import Blank from '../pages/blank.svelte';
import MultipleChoice from '../pages/multiple_choice.svelte';
import { player_state } from '../stores/player_state';
import { authStore } from './stores/authStore';
import type { Avatar, PlayerState } from '../types/player_state';
import { getToastStore, initializeStores, type ToastStore } from '@skeletonlabs/skeleton';
import { get } from 'svelte/store';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

let ws: WebSocket | null = null;
let toastStore: ToastStore;
let screens: Record<string, any> = {
    "start": Game,
    "can_start": GameAdmin,
    "blank": Blank,
    "multiple_choice": MultipleChoice,
};

let r_code = "";
let r_name = "";

let playing = false;
let retryCount = 0;
const maxRetries = 10;

let pendingResponses = new Map();
let reconnectInterval: any;


// Setup toast store on app initialization
function app_init() {
    toastStore = getToastStore();
}

// Setup WebSocket when app mounts
function setup_script() {
    websocketSetup();
}

// Joined game callback
const joinedGameCallback = async () => {
    const user = get(authStore).user;
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

// WebSocket setup with error handling and reconnection
function websocketSetup() {
    if (ws) {
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
    }

    ws = new WebSocket('wss://lil-feed.com/');

    ws.onmessage = handleMessage;
    ws.onclose = handleWebSocketClose;
    ws.onerror = handleWebSocketError;

    ws.onopen = () => {
        clearInterval(reconnectInterval);
        if (playing) {
            joinRoom(r_code, r_name); // Rejoin the room
        }
    };
}

// Handle WebSocket messages
function handleMessage(event: MessageEvent) {
    const e_data = JSON.parse(event.data);

    if (e_data.requestId && pendingResponses.has(e_data.requestId)) {
        const { resolve } = pendingResponses.get(e_data.requestId);
        resolve(e_data); // Resolve the specific promise
        pendingResponses.delete(e_data.requestId); // Clean up
    } else {
        switch (e_data['type']) {
            case "joinedRoom":
                joinedGameCallback();
                break;
            case "error":
                toastStore.trigger({ message: e_data['message'] });
                break;
            case "state":
                updateState(e_data['state']);
                break;
            case "roomDestroyed":
                let p_player = get(player_state);
                playing = false;
                p_player.screen = "room_ended";
                player_state.set(p_player);
                break;
        }
    }
}

// Handle WebSocket close
function handleWebSocketClose(event: CloseEvent) {
    reconnect();
}

// Handle WebSocket errors
function handleWebSocketError(event: Event) {
    console.error("WebSocket error:", event);
}

// Reconnect with exponential backoff
function reconnect() {
    retryCount = 0;
    reconnectInterval = setTimeout(() => {
        retryCount++;
        console.log(`Reconnecting... Attempt ${retryCount + 1}`);
        websocketSetup();
    }, 1000); // Exponential backoff, capped at 1 second
}

// Send a message and wait for a response
function sendMessageAndWaitForResponse(message: any) {
    const requestId = uuidv4(); // Generate a unique ID for this request
    message.requestId = requestId;

    return new Promise((resolve, reject) => {
        pendingResponses.set(requestId, { resolve, reject });

        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            reject(new Error("WebSocket is not open. Message not sent."));
        }
    });
}

// Send a message
function sendMessage(message: any) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "sendToHost", data: { message } }));
    } else {
        console.error("WebSocket is not open. Message not sent.");
    }
}

// Join a room
function joinRoom(code: string, name: string) {
    if (!code || !name) {
        console.error("Invalid room code or name.");
        return;
    }

    localStorage.setItem("name", name);
    localStorage.setItem("code", code);
    r_code = code;
    r_name = name;

    ws?.send(JSON.stringify({
        type: "joinRoom",
        data: { roomId: code, name, userID: get(authStore).user?.id },
    }));

}

// Update player state
function updateState(state: PlayerState) {
    try {
        player_state.set(state);
    } catch (error) {
        console.error("Failed to update player state:", error);
    }
}

// Get the user's name
function getName() {
    return r_name;
}

// Get server time
async function getTime() {
    try {
        const response: any = await sendMessageAndWaitForResponse({ type: "getTime" });
        return response['time'];
    } catch (error) {
        console.error("Failed to get time:", error);
    }
}

export { joinRoom, setup_script, app_init, sendMessage, getName, getTime };
