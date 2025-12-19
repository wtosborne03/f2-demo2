import { writable } from "svelte/store";
import { Avatar } from "@skeletonlabs/skeleton-svelte";
import type { PlayerState } from "$lib/wsapi/game";

interface PlayerStateClient extends PlayerState {
    pageData: any;
}

export const player_state = writable<PlayerStateClient>({
    name: "",
    score: 0,
    screen: "index",
    pageDataJson: "",
    pageData: {},
    isAdmin: false,
    drinks: 0,
    isConnected: false,
    timerStamp: new Date(0),
    timerDuration: 0,
    index: 0,
    color: '',
    team: '',
    avatar: {
        eyes: 0,
        hair: 0,
        mouth: 0,
        emote: 0,
    }
});

