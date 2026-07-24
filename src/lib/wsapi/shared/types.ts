export interface AvatarExpressions {
    neutral_open?: string;
    neutral_closed?: string;
    happy_open?: string;
    happy_closed?: string;
    sad_open?: string;
    sad_closed?: string;
    surprised_open?: string;
    surprised_closed?: string;
}

interface Avatar {
    eyes: number,
    mouth: number,
    hair: number,
    emote: number,
    selfieUrl?: string,
    expressions?: AvatarExpressions,
    gender?: string,
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
    paused?: boolean;
}

export interface PlayerInput {
    type: string;
    [key: string]: any;
}
