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
                p_player.screen = "room_ended";
                player_state.set(p_player);
                break;
        }

    }
    ws.onclose = () => {
        setTimeout(reconnect, 1000);
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
        ws.send(
            JSON.stringify({
                type: "joinRoom",
                data: { roomId: r_code, name: r_name, userID: get(authStore).user?.id },
            }),
        );
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

export { joinRoom, setup_script, app_init, sendMessage }