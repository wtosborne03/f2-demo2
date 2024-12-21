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
let heartbeatInterval: any | undefined;
let pendingResponses = new Map();

// Add message queue and processing flag
let messageQueue: any[] = [];
let isProcessingMessage = false;

// Add connection state tracking
let isConnected = false;
let isReconnecting = false;

// Add constants
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_TIMEOUT = 5000;   // 5 seconds

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
}

// Enhance WebSocket setup
function websocketSetup() {
    if (ws) {
        clearInterval(heartbeatInterval);  // Clear existing heartbeat
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
    }

    try {
        ws = new WebSocket('wss://lil-feed.com:5004/');

        ws.onmessage = handleMessage;
        ws.onclose = handleWebSocketClose;
        ws.onerror = handleWebSocketError;

        ws.onopen = () => {
            isConnected = true;
            isReconnecting = false;
            retryCount = 0;
            startHeartbeat();
            if (playing) {
                joinRoom(r_code, r_name);
            }
        };
    } catch (err) {
        console.error('WebSocket setup failed:', err);
        handleWebSocketError(new Event('error'));
    }
}

// Add heartbeat function
function startHeartbeat() {
    clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(async () => {
        if (!isConnected || !ws) return;

        try {
            await sendMessageAndWaitForResponse({ type: "getTime" }, HEARTBEAT_TIMEOUT);
        } catch (error) {
            console.warn("Heartbeat failed:", error);
            handleWebSocketClose(new CloseEvent('close', { reason: 'Heartbeat timeout' }));
        }
    }, HEARTBEAT_INTERVAL);
}

// Enhance message queue processing
function handleMessage(event: MessageEvent) {
    try {
        const e_data = JSON.parse(event.data);

        // Add message validation
        if (!e_data || !e_data.type) {
            console.error('Invalid message format:', e_data);
            return;
        }

        if (e_data.requestId && pendingResponses.has(e_data.requestId)) {
            const { resolve, timeout } = pendingResponses.get(e_data.requestId);
            clearTimeout(timeout);
            resolve(e_data);
            pendingResponses.delete(e_data.requestId);
        } else {
            switch (e_data.type) {
                case "joinedRoom":
                    joinedGameCallback();
                    break;
                case "error":
                    toastStore.trigger({ message: e_data.message });
                    console.error("WebSocket error:", e_data.message);
                    break;
                case "state":
                    if (messageQueue.length > 50) {
                        messageQueue.length = 0; // Clear queue if too many pending messages
                        console.warn('Message queue cleared due to overflow');
                    }
                    messageQueue.push(e_data);
                    processMessageQueue();
                    break;
                case "roomDestroyed":
                    let p_player = get(player_state);
                    playing = false;
                    p_player.screen = "room_ended";
                    player_state.set(p_player);
                    break;
            }
        }
    } catch (err) {
        console.error('Message handling error:', err);
    }
}

// Handle WebSocket close
function handleWebSocketClose(event: CloseEvent) {
    console.warn("WebSocket closed:", event.reason);
    clearInterval(heartbeatInterval);
    reconnect();
}

// Handle WebSocket errors
function handleWebSocketError(event: Event) {
    console.error("WebSocket error:", event);
}

// Enhanced sendMessageAndWaitForResponse with timeout
function sendMessageAndWaitForResponse(message: any, timeoutMs: number = 5000) {
    const requestId = uuidv4();
    message.requestId = requestId;

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            if (pendingResponses.has(requestId)) {
                pendingResponses.delete(requestId);
                reject(new Error('Response timeout'));
            }
        }, timeoutMs);

        pendingResponses.set(requestId, { resolve, reject, timeout });

        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            clearTimeout(timeout);
            pendingResponses.delete(requestId);
            reject(new Error("WebSocket is not open"));
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

// Add state validation
function validateStateMessage(message: any) {
    return message?.state?.screen && screens[message.state.screen];
}

// Process messages sequentially
async function processMessageQueue() {
    if (isProcessingMessage || messageQueue.length === 0) return;

    isProcessingMessage = true;
    const message = messageQueue.shift();

    try {
        if (validateStateMessage(message)) {
            // Ensure store is updated in next tick
            await Promise.resolve();
            player_state.set(message.state);
        }
    } catch (err) {
        console.error('Error processing state:', err);
    } finally {
        isProcessingMessage = false;
        if (messageQueue.length > 0) {
            processMessageQueue();
        }
    }
}

// Enhance reconnect logic
function reconnect() {
    if (isReconnecting || retryCount >= maxRetries) {
        if (retryCount >= maxRetries) {
            console.error("Max retries reached");
            toastStore.trigger({ message: "Connection lost. Please refresh the page." });
        }
        return;
    }

    isReconnecting = true;
    const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000);

    setTimeout(() => {
        if (!isConnected) {
            console.log(`Reconnecting... Attempt ${retryCount + 1}`);
            websocketSetup();
            retryCount++;
        }
    }, backoffTime);
}

export { joinRoom, setup_script, app_init, sendMessage, getName, getTime };
