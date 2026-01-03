// client/gameClient.ts
import { writable, get } from 'svelte/store';
import { OpCode, encode, decode } from './shared/protocol';
import type { PlayerInput, PlayerState } from './shared/types';
import { toaster } from '$lib/util/toaster';
import { dbClient } from '../../stores/apiClient';

const defaultPlayerState: PlayerState = {
    name: '',
    score: 0,
    screen: 'index',
    page_data: null,
    admin: false,
    drinks: 0,
    timer_stamp: new Date(),
    timer_duration: 0,
    index: -1,
    color: '',
    team: '',
    avatar: {
        eyes: 0,
        mouth: 0,
        hair: 0,
        emote: 0,
    },
}

export const gameState = writable<PlayerState>(defaultPlayerState); // The screen content
export const connectionStatus = writable<"DISCONNECTED" | "CONNECTING" | "CONNECTED">("DISCONNECTED");
export const errorStore = writable<string | null>(null);
export const serverTimeOffset = writable<number>(0); // Add this to track time difference

const ignoreErrors = [
    "Game_Lobby"
]

class GameClient {
    private ws: WebSocket | null = null;
    private name: string = "";
    private playerId: string | null = null; // localStorage.getItem('couch_pid');
    private roomCode: string | null = null; // localStorage.getItem('couch_room');
    private shouldReconnect = true;
    private pingInterval: NodeJS.Timeout | null = null;
    private pongTimeout: NodeJS.Timeout | null = null;
    private latency = 0;
    private _lastTimeRequest = 0;
    private waiters: Array<{ ops: OpCode[]; resolve: (val: any) => void }> = [];

    connect(url: string) {
        connectionStatus.set("CONNECTING");
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            connectionStatus.set("CONNECTED");
            this.startHeartbeat(); // Start pinging
            this.syncTime();
            // Auto-decide: Join fresh or Reconnect?
            if (this.playerId && this.roomCode) {
                this.send(OpCode.RECONNECT, { roomCode: this.roomCode, playerId: this.playerId });
            }
        };

        this.ws.onmessage = (event) => {
            const { op, payload } = decode(event.data);

            // Notify any waiters
            this.waiters = this.waiters.filter((w) => {
                if (w.ops.includes(op)) {
                    w.resolve({ op, payload });
                    return false;
                }
                return true;
            });

            switch (op) {
                case OpCode.IDENTITY:
                    this.joinedRoom(payload.playerId, payload.roomCode);
                    break;
                case OpCode.STATE_UPDATE:
                    gameState.set(payload);
                    break;
                case OpCode.ERROR:
                    errorStore.set(payload);
                    if (!ignoreErrors.includes(payload)) {
                        toaster.error({ title: "Error", description: payload });
                    }
                    // If error is "Session expired", clear local storage
                    if (payload === "Session expired" || payload === "Room invalid") {
                        this.clearSession();
                    }
                    break;
                case OpCode.PONG:
                    this.handlePong();
                    break;

                case OpCode.TIME_RESPONSE:
                    this.handleTimeResponse(payload); // payload is server timestamp
                    break;

                case OpCode.GAME_ENDED:
                    this.handleGameEnded();
                    break;
            }
        };

        this.ws.onclose = () => {
            this.stopHeartbeat();
            connectionStatus.set("DISCONNECTED");
            if (this.shouldReconnect) {
                setTimeout(() => this.connect(url), 1500); // Simple Retry Strategy
            }
        };
    }

    private async joinedRoom(playerId: string, roomCode: string) {
        this.playerId = playerId;
        this.roomCode = roomCode;
        localStorage.setItem("code", this.roomCode!);
        localStorage.setItem("name", this.name);
        localStorage.setItem('couch_pid', playerId);
        localStorage.setItem('couch_room', roomCode);

        try {
            const { data: me } = await get(dbClient)!.getUsersMe()
            const avatar = {
                eyes: me.avatar_eyes,
                mouth: me.avatar_mouth,
                hair: me.avatar_hair,
                emote: me.avatar_emote,
            }
            this.sendPlayerInput("avatarUpdate", { avatar })
        } catch (error) {
            console.error("Failed to get user:", error);
        }
    }

    private handleGameEnded() {
        this.clearSession();
        this.shouldReconnect = false;
        this.ws?.close();
        gameState.set({
            ...get(gameState),
            screen: "room_ended"
        });
    }

    async join(room: string, name: string, userId?: string) {

        if (localStorage.getItem("couch_room") === room) {
            // try rejoin
            const rejoined = await this.tryRejoin();
            if (rejoined) return;
        }
        // Clear old session if joining new room
        this.clearSession();
        this.name = name;
        this.send(OpCode.JOIN_ROOM, { roomCode: room, name, userId });
    }

    public async tryRejoin(): Promise<boolean> {
        const roomCode = localStorage.getItem('couch_room');
        const playerId = localStorage.getItem('couch_pid');

        if (!roomCode || !playerId) return false;

        this.send(OpCode.RECONNECT, { roomCode, playerId });

        try {
            const res = await this.waitForResponse([OpCode.IDENTITY, OpCode.ERROR]);
            if (res.op === OpCode.ERROR) {
                console.warn("Rejoin failed:", res.payload);
                return false;
            }
            return true;
        } catch (e) {
            console.error("Rejoin timed out or failed", e);
            return false;
        }
    }

    private waitForResponse(ops: OpCode[], timeout = 5000): Promise<{ op: OpCode; payload: any }> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.waiters = this.waiters.filter((w) => w !== waiter);
                reject('Timeout');
            }, timeout);

            const waiter = {
                ops,
                resolve: (val: any) => {
                    clearTimeout(timer);
                    resolve(val);
                },
            };
            this.waiters.push(waiter);
        });
    }


    sendInput(data: PlayerInput) {
        // High priority, minimal latency
        this.send(OpCode.INPUT, data);
    }

    /**
     * Send Player Input
     * @param type - type of input action, eg "startGame", "move", "textPrompt"...
     * @param data - input payload data
     */
    sendPlayerInput(type: string, data?: any) {
        this.send(OpCode.INPUT, {
            type: type,
            ...(data)
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        // Send a ping every 5 seconds
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send(OpCode.PING, null);

                // If we don't get a PONG in 2 seconds, assume dead and reconnect
                this.pongTimeout = setTimeout(() => {
                    console.warn("Connection stale. Reconnecting...");
                    this.ws?.close(); // This triggers onclose -> retry
                }, 5000);
            }
        }, 5000);
    }

    public async syncTime() {
        const start = Date.now();
        // We use a one-off listener or specific logic, but for simplicity
        // we assume the next TIME_RESPONSE matches this request.
        // In production, you might attach a request ID.
        this.send(OpCode.GET_TIME, null);

        // We store 'start' in a temporary property to calculate latency in handleTimeResponse
        this._lastTimeRequest = start;
    }

    private handleTimeResponse(serverTs: number) {
        const end = Date.now();
        const rtt = end - (this._lastTimeRequest || end);
        this.latency = rtt / 2;

        // Offset = ServerTime - LocalTime
        // Current Server Time ~= LocalTime + Offset
        const offset = serverTs - end + this.latency;
        serverTimeOffset.set(offset);
    }

    private stopHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
    }

    private handlePong() {
        // We are alive! Clear the "death timer"
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
    }

    private send(op: OpCode, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(encode(op, data));
        }
    }

    private clearSession() {
        this.playerId = null;
        this.roomCode = null;
        localStorage.removeItem('couch_pid');
        localStorage.removeItem('couch_room');
    }
}

export const gameClient = new GameClient();