import { writable } from "svelte/store";
import type { PlayerState } from "../types/player_state";
import { Avatar } from "@skeletonlabs/skeleton";

export const player_state = writable<PlayerState>({
    name: "",
    score: 0,
    screen: "index",
    page_data: {},
    admin: false,
    drinks: 0,
    timer_stamp: new Date(0),
    timer_duration: 0,
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

