interface PlayerState {
    name: string;
    score: number;
    screen: string;
    page_data: any;
    admin: boolean;
    drinks: number;
    timer_stamp: Date;
    timer_duration: number;
}
export type { PlayerState };