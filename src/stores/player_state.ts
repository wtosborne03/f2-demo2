import { writable } from "svelte/store";
import type { PlayerState } from "../types/player_state";

export const player_state = writable<PlayerState>({
    name: "",
    score: 0,
    screen: "index",
    page_data: {},
    admin: false,
    drinks: 0,
    timer_stamp: new Date(0),
    timer_duration: 0,
});

