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

let ws: WebSocket;
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
let pendingResponses = new Map();

// setup toast store on app initialization
function app_init() {
    toastStore = getToastStore();
}

// setup websocket when app mounts
function setup_script() {
    //document.addEventListener('visibilitychange', reconnect);
    websocketSetup();
}

const joinedGameCallback = async () => {
    if (get(authStore).user) {
        console.log("joined game callback");
        playing = true;
        // if logged in, send avatar data
        const { error, data } = await supabase.from('users').select('*').eq('id', get(authStore).user!.id).single();
        if (error) {
            console.error(error);
            return;
        }
        console.log(data);
        const avatar: Avatar = {
            eyes: data.avatar_eyes || 0,
            hair: data.avatar_hair || 0,
            mouth: data.avatar_mouth || 0,
            emote: data.avatar_emote || 0,
        };
        sendMessage({
            type: "avatar_update",
            data: {
                avatar: avatar,
            }
        })
    }
}

function websocketSetup() {
    ws = new WebSocket('wss://lil-feed.com/');

    ws.onmessage = (event) => {

        let e_data = JSON.parse(event.data)
        console.log(e_data);

        if (e_data.requestId && pendingResponses.has(e_data.requestId)) {
            const { resolve } = pendingResponses.get(e_data.requestId);
            resolve(e_data);  // Resolve the specific promise
            pendingResponses.delete(e_data.requestId);  // Clean up
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
    ws.onclose = () => {
        setTimeout(reconnect, 1000);
    }
}

/***  Function to send a message and wait for a specific response */
function sendMessageAndWaitForResponse(message: any) {
    const requestId = uuidv4(); // Generate a unique ID for this request
    message.requestId = requestId;

    return new Promise((resolve, reject) => {
        pendingResponses.set(requestId, { resolve, reject });
        ws.send(JSON.stringify(message));
    });
}

async function getTime() {
    try {
        const response: any = await sendMessageAndWaitForResponse({ type: "getTime" });
        console.log("Time response:", response);
        return response['time'];
    } catch (error) {
        console.error("Failed to get time:", error);
    }
}

function joinRoom(code: string, name: string) {
    localStorage.setItem("name", name);
    localStorage.setItem("code", code);
    r_code = code;
    r_name = name;
    ws.send(
        JSON.stringify({
            type: "joinRoom",
            data: { roomId: code, name: name, userID: get(authStore).user?.id },
        }),
    );

}

function reconnect() {
    websocketSetup();

    ws.onopen = () => {
        if (playing) {
            ws.send(
                JSON.stringify({
                    type: "joinRoom",
                    data: { roomId: r_code, name: r_name, userID: get(authStore).user?.id },
                }),
            );
        }
    }
}

function sendMessage(message: any) {
    ws.send(
        JSON.stringify({
            type: "sendToHost",
            data: { message: message },
        }),);
}

function updateState(state: PlayerState) {
    player_state.set(state);
}

function getName() {
    return r_name;
}

export { joinRoom, setup_script, app_init, sendMessage, getName, getTime }