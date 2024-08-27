import Game from '../pages/game.svelte';
import GameAdmin from '../pages/game_admin.svelte';
import RoomEnded from '../pages/room_ended.svelte';
import Blank from '../pages/blank.svelte';
import MultipleChoice from '../pages/multiple_choice.svelte';
import { player_state } from '../stores/player_state';
import type { PlayerState } from '../types/player_state';
import { getToastStore, initializeStores, type ToastStore } from '@skeletonlabs/skeleton';
import { get } from 'svelte/store';

let ws: WebSocket;
let toastStore: ToastStore;
let screens: Record<string, any> = {
    "start": Game,
    "can_start": GameAdmin,
    "blank": Blank,
    "multiple_choice": MultipleChoice,
};

// setup toast store on app initialization
function app_init() {
    toastStore = getToastStore();
}

// setup websocket when app mounts
function setup_script() {
    ws = new WebSocket('wss://locktext.xyz/');
    ws.onmessage = (event) => {
        let e_data = JSON.parse(event.data)

        console.log("Received:", e_data);
        console.log(e_data['type']);
        switch (e_data['type']) {
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
}

function joinRoom(code: string, name: string) {
    localStorage.setItem("name", name);
    localStorage.setItem("code", code);
    ws.send(
        JSON.stringify({
            type: "joinRoom",
            data: { roomId: code, name: name },
        }),
    );

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