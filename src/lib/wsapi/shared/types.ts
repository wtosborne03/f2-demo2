
interface Avatar {
    eyes: number,
    mouth: number,
    hair: number,
    emote: number,
}

export interface PlayerState {
    name: string;
    score: number;
    screen: string;
    page_data: any;
    admin: boolean;
    drinks: number;
    timer_stamp: Date;
    timer_duration: number;
    index: number;
    color: string;
    team: string;
    avatar: Avatar;
}

export interface PlayerInput {
    type: string;
    [key: string]: any;
}
