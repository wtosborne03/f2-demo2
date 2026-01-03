// shared/protocol.ts
import { pack, unpack } from 'msgpackr';

// shared/protocol.ts
export enum OpCode {
    // Client -> Server
    JOIN_ROOM = 1,
    RECONNECT = 2,
    INPUT = 3,
    PING = 4,          // New: Keep-alive
    GET_TIME = 5,      // New: Request server time

    // Server -> Client
    ERROR = 10,
    IDENTITY = 11,
    STATE_UPDATE = 12,
    PONG = 13,         // New: Response to Ping
    TIME_RESPONSE = 14,// New: Response with server timestamp

    // Server -> Host
    PLAYER_JOINED = 20,
    PLAYER_LEFT = 21,
    PLAYER_INPUT = 22,

    // Host -> Server
    HOST_ERROR = 30,    // New: Host instructing server to send error to specific player
    GAME_START = 99
}

// ... encode/decode remain the same

export const encode = (op: OpCode, data: any) => {
    const buffer = pack(data);
    const combined = new Uint8Array(buffer.length + 1);
    combined[0] = op;
    combined.set(buffer, 1);
    return combined;
};

export const decode = (data: ArrayBuffer | Uint8Array) => {
    const view = new Uint8Array(data);
    const op = view[0] as OpCode;
    const payload = unpack(view.subarray(1));
    return { op, payload };
};