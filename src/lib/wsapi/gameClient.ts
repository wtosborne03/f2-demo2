import {
    WsClientPacket, WsServerPacket, GameStage, type PlayerInputPayload,
    type CreateRoomResponse, type JoinRoomResponse, type GetServerTimeResponse,
    type GameEvent, type RoomState, type PlayerState, type ConnectionChange,
    type ErrorResponse,
    PlayerInput,
    JoinRoomRequest
} from './game';

type Role = 'HOST' | 'PLAYER';

/** Map of event names to payload types for GameClient events */
export interface GameClientEvents {
    open: void;
    close: void;
    raw: unknown; // raw string or parsed JSON
    createRoomResponse: CreateRoomResponse;
    joinRoomResponse: JoinRoomResponse;
    getTimeResponse: GetServerTimeResponse;
    gameEvent: GameEvent;
    fullSync: RoomState;
    playerUpdate: PlayerState;
    connectionChange: ConnectionChange;
    playerInput: PlayerInput;
    error: ErrorResponse;
}

type Handler = (payload?: any) => void;
interface PendingRpc<T> {
    resolve: (payload: T) => void;
    reject: (reason?: any) => void;
    timeoutId?: ReturnType<typeof setTimeout>;
    filter?: (payload: T) => boolean;
}

export interface GameClientOptions {
    url: string;
    role?: Role;
    autoReconnect?: boolean;
    reconnectInterval?: number; // ms
    autoRejoin?: boolean;
    rpcTimeoutMs?: number;
}

export class GameClient {
    url: string;
    role: Role;
    ws: WebSocket | null = null;
    handlers = new Map<string, Handler[]>();
    private pendingRpcs = new Map<string, PendingRpc<any>[]>();
    autoReconnect: boolean;
    reconnectInterval: number;
    rpcTimeoutMs: number;
    private shouldReconnect = false;
    autoRejoin: boolean;
    public lastRoomCode?: string;
    public lastPlayerToken?: string;
    public lastPlayerName?: string;
    public hostToken?: string;

    constructor(opts: GameClientOptions) {
        this.url = opts.url;
        this.role = opts.role ?? 'PLAYER';
        this.autoReconnect = opts.autoReconnect ?? true;
        this.reconnectInterval = opts.reconnectInterval ?? 1500;
        this.autoRejoin = opts.autoRejoin ?? true;
        this.rpcTimeoutMs = opts.rpcTimeoutMs ?? 5000;
    }

    on<K extends keyof GameClientEvents>(event: K, cb: (payload?: GameClientEvents[K]) => void) {
        const arr = this.handlers.get(event as string) ?? [];
        arr.push(cb as Handler);
        this.handlers.set(event as string, arr);
    }

    off<K extends keyof GameClientEvents>(event: K, cb?: (payload?: GameClientEvents[K]) => void) {
        if (!cb) {
            this.handlers.delete(event as string);
            return;
        }
        const arr = this.handlers.get(event as string) ?? [];
        this.handlers.set(event as string, arr.filter((c) => c !== (cb as Handler)));
    }

    private emit<K extends keyof GameClientEvents>(event: K, payload?: GameClientEvents[K]) {
        const arr = this.handlers.get(event as string) ?? [];
        for (const cb of arr) cb(payload);
        this.resolveRpc(event, payload);
    }

    private enqueueRpc<K extends keyof GameClientEvents>(event: K, pending: PendingRpc<GameClientEvents[K]>) {
        const key = event as string;
        const queue = this.pendingRpcs.get(key) ?? [];
        queue.push(pending as PendingRpc<any>);
        this.pendingRpcs.set(key, queue);
    }

    private removePending(key: string, pending: PendingRpc<any>) {
        const queue = this.pendingRpcs.get(key);
        if (!queue) return;
        const idx = queue.indexOf(pending);
        if (idx === -1) return;
        queue.splice(idx, 1);
        if (queue.length === 0) {
            this.pendingRpcs.delete(key);
        }
    }

    private resolveRpc<K extends keyof GameClientEvents>(event: K, payload?: GameClientEvents[K]) {
        const key = event as string;
        const queue = this.pendingRpcs.get(key);
        if (!queue || !queue.length) return;
        for (let i = 0; i < queue.length; i++) {
            const pending = queue[i];
            const typedPayload = payload as GameClientEvents[K];
            if (pending.filter && !pending.filter(typedPayload)) continue;
            queue.splice(i, 1);
            if (!queue.length) this.pendingRpcs.delete(key);
            if (pending.timeoutId) clearTimeout(pending.timeoutId);
            pending.resolve(typedPayload);
            return;
        }
    }

    private rejectAllPending(reason: Error | string) {
        const error = typeof reason === 'string' ? new Error(reason) : reason;
        for (const [key, queue] of this.pendingRpcs.entries()) {
            while (queue.length) {
                const pending = queue.shift();
                if (!pending) continue;
                if (pending.timeoutId) clearTimeout(pending.timeoutId);
                pending.reject(error);
            }
            this.pendingRpcs.delete(key);
        }
    }

    private rpc<K extends keyof GameClientEvents>(
        responseEvent: K,
        send: () => void,
        options?: { timeoutMs?: number; filter?: (payload: GameClientEvents[K]) => boolean }
    ): Promise<GameClientEvents[K]> {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('Socket not open'));
                return;
            }

            const pending: PendingRpc<GameClientEvents[K]> = {
                resolve,
                reject,
                filter: options?.filter,
            };

            const timeout = options?.timeoutMs ?? this.rpcTimeoutMs;
            if (timeout > 0) {
                pending.timeoutId = setTimeout(() => {
                    this.removePending(responseEvent as string, pending as PendingRpc<any>);
                    reject(new Error(`RPC timeout waiting for ${String(responseEvent)}`));
                }, timeout);
            }

            this.enqueueRpc(responseEvent, pending);

            try {
                send();
            } catch (err) {
                this.removePending(responseEvent as string, pending as PendingRpc<any>);
                if (pending.timeoutId) clearTimeout(pending.timeoutId);
                reject(err);
            }
        });
    }

    connect() {
        if (this.ws) return;
        this.shouldReconnect = this.autoReconnect;
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = () => {
            this.emit('open');
            // If player and we have room/name, rejoin automatically
            if (this.autoRejoin && this.role === 'PLAYER' && this.lastRoomCode && this.lastPlayerName) {
                try {
                    // Avoid race if open event handler chain triggers non-open state
                    setTimeout(() => this.joinRoom(this.lastRoomCode!, this.lastPlayerName!), 50);
                } catch (e) {
                    /* ignore */
                }
            }
        };
        this.ws.onclose = async () => {
            this.emit('close');
            this.rejectAllPending(new Error('Socket closed'));
            this.ws = null;
            if (this.shouldReconnect) {
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };
        this.ws.onmessage = (ev) => {
            const data = ev.data as ArrayBuffer | string;
            if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    this.emit('raw', parsed);
                } catch {
                    this.emit('raw', data);
                }
                return;
            }
            try {
                const arr = new Uint8Array(data as ArrayBuffer);
                const msg = WsServerPacket.decode(arr);
                if (!msg.packet) return;
                switch (msg.packet.$case) {
                    case 'playerInput':
                        this.emit('playerInput', msg.packet.playerInput);
                        break;
                    case 'createRoomResponse':
                        this.hostToken = msg.packet.createRoomResponse?.hostToken;
                        this.lastRoomCode = msg.packet.createRoomResponse?.roomCode;
                        this.emit('createRoomResponse', msg.packet.createRoomResponse);
                        break;
                    case 'joinRoomResponse':
                        // store token
                        this.lastPlayerToken = msg.packet.joinRoomResponse?.playerToken;
                        this.emit('joinRoomResponse', msg.packet.joinRoomResponse);
                        break;
                    case 'getTimeResponse':
                        this.emit('getTimeResponse', msg.packet.getTimeResponse);
                        break;
                    case 'gameEvent':
                        this.emit('gameEvent', msg.packet.gameEvent);
                        // also emit per event
                        if (msg.packet.gameEvent?.event) {
                            const packet = msg.packet.gameEvent.event;
                            switch (packet.$case) {
                                case 'fullSync':
                                    this.emit('fullSync', packet.fullSync);
                                    break;
                                case 'playerUpdate':
                                    this.emit('playerUpdate', packet.playerUpdate);
                                    break;
                                case 'connectionChange':
                                    this.emit('connectionChange', packet.connectionChange);
                                    break;
                            }
                        }
                        break;
                    case 'error':
                        this.emit('error', msg.packet.error);
                        break;
                }
            } catch (err) {
                this.emit('error', { message: 'Failed to process incoming message', code: 20024 });
            }
        };
    }

    close() {
        if (!this.ws) return;
        this.shouldReconnect = false;
        this.ws.close();
        this.ws = null;
    }

    reconnect() {
        this.shouldReconnect = true;
        if (this.ws) {
            this.ws.close();
        } else {
            this.connect();
        }
    }

    setPlayerToken(token: string) {
        this.lastPlayerToken = token;
    }

    setHostToken(token: string) {
        this.hostToken = token;
    }

    sendRawString(payload: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('Socket not open');
        this.ws.send(payload);
    }

    private send(packet: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Socket not open');
        }
        const bytes = WsClientPacket.encode(packet).finish();
        this.ws.send(bytes);
    }

    // Host Methods
    createRoom() {
        if (this.role !== 'HOST') throw new Error('createRoom requires host role');
        this.send({ packet: { $case: 'createRoom', createRoom: {} } });
    }

    setStage(roomCode: string, hostToken: string, stage: GameStage) {
        this.send({ packet: { $case: 'setStage', setStage: { roomCode, hostToken, stage } } });
    }

    updatePlayer(updates: Record<string, Partial<PlayerState> | undefined>) {
        this.send({ packet: { $case: 'updatePlayer', updatePlayer: { updates } } });
    }

    // Player Methods
    joinRoom(roomCode: string, playerName: string, userId?: string) {
        this.lastRoomCode = roomCode;
        this.lastPlayerName = playerName;
        const packet: JoinRoomRequest = { roomCode, playerName, userId: userId ?? '' };
        this.send({ packet: { $case: 'joinRoom', joinRoom: packet } });
    }

    leaveRoom(roomCode: string, playerToken?: string) {
        this.send({ packet: { $case: 'leaveRoom', leaveRoom: { roomCode, playerToken: playerToken ?? this.lastPlayerToken ?? '' } } });
    }

    sendPlayerInput(input: PlayerInputPayload) {
        this.send({ packet: { $case: 'playerInput', playerInput: { input } } });
    }

    ping() {
        return this.getTime();
    }

    /**
     * Request the authoritative server time and await the protobuf response.
     * @param timeoutMs override the default RPC timeout in milliseconds
     */
    getTime(timeoutMs?: number) {
        return this.rpc('getTimeResponse', () => {
            this.send({ packet: { $case: 'getTime', getTime: { clientTimestamp: Date.now() } } });
        }, { timeoutMs });
    }

}

export default GameClient;
