interface PlayerState {
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
}
export type { PlayerState };