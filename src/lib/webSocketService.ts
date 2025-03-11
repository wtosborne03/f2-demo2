import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import { joinedGameCallback, roomEnded, updateState } from './gameService';
import { getToastStore, type ToastStore } from '@skeletonlabs/skeleton';

export const conn_store = writable(false);

let ws: WebSocket | null = null;
let pendingResponses = new Map();
let reconnectInterval: any;
let pingInterval: any;
const pingIntervalTime = 6 * 1000; // 30 seconds
const pingTimeoutTime = 5 * 1000; // 10 seconds
let pongTimeout: any;

let toastStore: ToastStore;

export function websocketSetup() {
    toastStore = getToastStore();
    if (ws) {
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
    }

    ws = new WebSocket('wss://api.couchcup.tv');

    ws.onmessage = handleMessage;
    ws.onclose = handleWebSocketClose;
    ws.onerror = handleWebSocketError;

    ws.onopen = () => {
        conn_store.set(true);
        clearInterval(reconnectInterval);
        clearInterval(pingInterval);
        clearTimeout(pongTimeout);
        pingInterval = setInterval(sendPing, pingIntervalTime);
    };
}

function handleMessage(event: MessageEvent) {
    const e_data = JSON.parse(event.data);

    if (e_data.type === "pong") {
        clearTimeout(pongTimeout);
    }

    // Handle resolved request ID
    if (e_data.requestId && pendingResponses.has(e_data.requestId)) {
        const { resolve } = pendingResponses.get(e_data.requestId);
        resolve(e_data); // Resolve the specific promise
        pendingResponses.delete(e_data.requestId);
        return;
    }

    switch (e_data['type']) {
        case "joinedRoom":
            joinedGameCallback();
            break;
        case "error":
            // Display error message
            toastStore.trigger({ message: e_data['message'] });
            console.error("Error:", e_data['message']);
            break;
        case "state":
            updateState(e_data['state']);
            break;
        case "roomDestroyed":
            roomEnded();
            break;
    }
}

function handleWebSocketClose(event: CloseEvent) {
    conn_store.set(false);
    clearInterval(pingInterval);
    reconnect();
}

function handleWebSocketError(event: Event) {
    console.error("WebSocket error:", event);
}

function reconnect() {
    reconnectInterval = setTimeout(() => {
        websocketSetup();
    }, 1000);
}

/**
 * Send a message to the server and wait for a response.
 * @param message - The message to send to the server
 * @returns A promise that resolves with the server's response
 */
export function sendMessageAndWaitForResponse(message: any) {
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

/**
 * Send Game Message to Host
 * @param message - The message to send to the host
 */
export function sendMessage(message: any) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "sendToHost", data: { message } }));
    } else {
        console.error("WebSocket is not open. Message not sent.");
    }
}

export function sendRawMessage(message: any) {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        console.error("WebSocket is not open. Message not sent.");
    }
}

function sendPing() {
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
        pongTimeout = setTimeout(() => {
            console.error("Pong not received in time, closing WebSocket.");
            handleWebSocketClose(new CloseEvent("close", { code: 1006, reason: "Pong not received" }));
        }, pingTimeoutTime);
    }
}