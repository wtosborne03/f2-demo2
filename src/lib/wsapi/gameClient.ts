// client/gameClient.ts
import { writable, get } from 'svelte/store';
import { OpCode, encode, decode } from './shared/protocol';
import type { PlayerInput, PlayerState } from './shared/types';
import { toaster } from '$lib/util/toaster';
import { dbClient } from '../../stores/apiClient';

const RECONNECT_DELAY_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 10000;
const HEARTBEAT_TIMEOUT_MS = 25000;
const MAX_PENDING_CRITICAL_MESSAGES = 50;

type RoomStatus = "LOBBY" | "RUNNING" | "UNKNOWN";

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

const ignoreErrors: string[] = ['Game_Lobby', 'Session expired', 'Room not found'];

class GameClient {
    private ws: WebSocket | null = null;
    private name: string = "";
    private roomCode: string | null = null; // localStorage.getItem('couch_room');
    private connectUrl: string | null = null;
    private shouldReconnect = true;
    private pingInterval: NodeJS.Timeout | null = null;
    private pongTimeout: NodeJS.Timeout | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private roomStatus: RoomStatus = "UNKNOWN";
    private hasSeenInGameState = false;
    private latency = 0;
    private _lastTimeRequest = 0;
    private waiters: Array<{ ops: OpCode[]; resolve: (val: any) => void }> = [];
    private pendingCriticalMessages: Array<{ op: OpCode; data: any }> = [];
    private hasBoundLifecycleListeners = false;

    constructor() {
        this.hydrateSessionFromStorage();
        this.bindBrowserLifecycleListeners();
    }

    connect(url: string) {
        this.connectUrl = url;
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        connectionStatus.set("CONNECTING");
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            connectionStatus.set("CONNECTED");
            this.startHeartbeat(); // Start pinging
            this.syncTime();
            // Auto-decide: Join fresh or Reconnect when no explicit queued session action exists.
            const hasQueuedSessionAction = this.pendingCriticalMessages.some(
                (message) => message.op === OpCode.JOIN_ROOM || message.op === OpCode.RECONNECT
            );
            if (!hasQueuedSessionAction && this.canAttemptSessionReconnect()) {
                this.sendCritical(OpCode.RECONNECT, { roomCode: this.roomCode, name: this.name });
            }
            this.flushCriticalQueue();
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
                    this.joinedRoom(payload.playerId, payload.roomCode, payload.status);
                    break;
                case OpCode.STATE_UPDATE:
                    this.trackStateStatus(payload);
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
            this.scheduleReconnect();
        };
    }

    private async joinedRoom(_playerId: string, roomCode: string, status?: string) {
        this.roomCode = roomCode;
        this.setRoomStatus(status);
        localStorage.setItem("code", this.roomCode!);
        localStorage.setItem("name", this.name);
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
        this.sendCritical(OpCode.QUERY_ROOM_STATE, { roomCode: room }); // Ask server for current room state to decide if we can rejoin
        let roomState: "LOBBY" | "RUNNING";
        try {
            const res = await this.waitForResponse([OpCode.ROOM_STATE, OpCode.ERROR], 3000);
            if (res.op === OpCode.ERROR) throw new Error(res.payload);
            roomState = res.payload.status;
        }
        catch (e) {
            console.warn("Failed to get room state");
            toaster.error({ title: "Error", description: "Room Not Found or Server Unreachable" });
            return;
        }


        this.name = name;

        if (localStorage.getItem("couch_room") === room && roomState === "RUNNING") {
            // try rejoin
            const rejoined = await this.tryRejoin(true);
            if (rejoined) return;
        }
        // Clear old session if joining new room
        this.clearSession();
        this.roomStatus = "UNKNOWN";
        this.hasSeenInGameState = false;
        this.sendCritical(OpCode.JOIN_ROOM, { roomCode: room, name, userId });
    }

    public async tryRejoin(force = false): Promise<boolean> {
        const roomCode = localStorage.getItem('couch_room');
        const name = this.name || localStorage.getItem('name');

        if (!roomCode || !name) return false;
        if (!this.canAttemptSessionReconnect(force)) return false;

        this.sendCritical(OpCode.RECONNECT, { roomCode, name });

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
        // Mobile browsers throttle timers when backgrounded, so use a wider stale window.
        this.pingInterval = setInterval(() => {
            if (typeof document !== "undefined" && document.visibilityState !== "visible") {
                return;
            }
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send(OpCode.PING, null);

                // If we don't get a PONG within timeout, assume dead and reconnect.
                if (this.pongTimeout) clearTimeout(this.pongTimeout);
                this.pongTimeout = setTimeout(() => {
                    console.warn("Connection stale. Reconnecting...");
                    this.ws?.close(); // This triggers onclose -> retry
                }, HEARTBEAT_TIMEOUT_MS);
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    public async syncTime() {
        const start = Date.now();
        // We use a one-off listener or specific logic, but for simplicity
        // we assume the next TIME_RESPONSE matches this request.
        // In production, you might attach a request ID.
        this.sendCritical(OpCode.GET_TIME, null);

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
        this.pingInterval = null;
        this.pongTimeout = null;
    }

    private handlePong() {
        // We are alive! Clear the "death timer"
        if (this.pongTimeout) clearTimeout(this.pongTimeout);
        this.pongTimeout = null;
    }

    private send(op: OpCode, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(encode(op, data));
        }
    }

    private sendCritical(op: OpCode, data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {

            this.ws.send(encode(op, data));
            return;
        }
        this.pendingCriticalMessages.push({ op, data });
        if (this.pendingCriticalMessages.length > MAX_PENDING_CRITICAL_MESSAGES) {
            this.pendingCriticalMessages.shift();
        }
    }

    private flushCriticalQueue() {
        if (this.ws?.readyState !== WebSocket.OPEN || this.pendingCriticalMessages.length === 0) {
            return;
        }
        const queued = [...this.pendingCriticalMessages];
        this.pendingCriticalMessages = [];
        queued.forEach((message) => {
            this.ws!.send(encode(message.op, message.data));
        });
    }

    private scheduleReconnect(delayMs = RECONNECT_DELAY_MS) {
        if (!this.shouldReconnect || !this.connectUrl) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        if (!this.canAttemptSessionReconnect()) return;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(this.connectUrl!), delayMs);
    }

    private hydrateSessionFromStorage() {
        if (typeof window === "undefined") return;
        this.roomCode = localStorage.getItem("couch_room");
        this.name = localStorage.getItem("name") || "";
    }

    private canAttemptSessionReconnect(force = false) {
        if (!this.roomCode || !this.name) return false;
        if (force) return true;
        if (this.roomStatus === "RUNNING") return true;
        return this.hasSeenInGameState;
    }

    private setRoomStatus(status?: string) {
        if (status === "RUNNING") {
            this.roomStatus = "RUNNING";
            this.hasSeenInGameState = true;
            return;
        }
        if (status === "LOBBY") {
            this.roomStatus = "LOBBY";
            return;
        }
        this.roomStatus = "UNKNOWN";
    }

    private trackStateStatus(payload: Partial<PlayerState>) {
        const screen = payload?.screen;
        if (!screen) return;
        // In practice lobby screens are index/start/can_start. Any other game screen implies RUNNING.
        if (screen === "index" || screen === "start" || screen === "can_start") {
            if (!this.hasSeenInGameState) {
                this.roomStatus = "LOBBY";
            }
            return;
        }
        this.roomStatus = "RUNNING";
        this.hasSeenInGameState = true;
    }

    private bindBrowserLifecycleListeners() {
        if (typeof window === "undefined" || this.hasBoundLifecycleListeners) return;
        this.hasBoundLifecycleListeners = true;

        window.addEventListener("online", () => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
                this.scheduleReconnect(250);
            }
        });

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "visible") {
                    if (this.ws?.readyState === WebSocket.OPEN) {
                        this.syncTime();
                        this.sendCritical(OpCode.PING, null);
                    } else {
                        this.scheduleReconnect(250);
                    }
                    return;
                }
                if (this.pongTimeout) {
                    clearTimeout(this.pongTimeout);
                    this.pongTimeout = null;
                }
            });
        }
    }

    private clearSession() {
        this.roomCode = null;
        this.roomStatus = "UNKNOWN";
        this.hasSeenInGameState = false;
        this.pendingCriticalMessages = [];
        if (typeof window !== "undefined") {
            localStorage.removeItem('couch_pid');
            localStorage.removeItem('couch_room');
        }
    }
}

export const gameClient = new GameClient();
