// import { writable } from "svelte/store";
// import { v4 as uuidv4 } from "uuid";
// import {
//   joinedGameCallback,
//   roomEnded,
//   updateState,
//   getPlaying,
//   reJoinRoom,
//   getName,
// } from "./gameService";
// import { toaster } from "./util/toaster";
// export const conn_store = writable(false);

// const pingIntervalTime = 6 * 1000; // 30 seconds
// const pingTimeoutTime = 5 * 1000; // 10 seconds

// export let ws: WebSocket | null = null;
// let pendingResponses = new Map();
// let reconnectInterval: any;
// let pingInterval: any;
// let pongTimeout: any;

// const wsUrl: string = import.meta.env.VITE_PUBLIC_WS_API_URL;

// // initialize websocket, pass ui store
// export function websocketSetup() {}

// //message router
// function handleMessage(event: MessageEvent) {
//   try {
//     // // If the server sends binary protobuf Envelope
//     // if (event.data instanceof ArrayBuffer) {
//     //     const buf = new Uint8Array(event.data);
//     //     const env = Envelope.decode(buf);

//     //     if (env.serverMessage) {
//     //         const sm = env.serverMessage as ServerMessage;
//     //         console.log('Received ServerMessage:', sm);

//     //         // pong handling
//     //         if (sm.pong) {
//     //             clearTimeout(pongTimeout);
//     //         }

//     //         // Handle resolved request ID
//     //         if (sm.requestId && pendingResponses.has(sm.requestId)) {
//     //             const { resolve } = pendingResponses.get(sm.requestId);
//     //             // resolve with a plain object representation
//     //             resolve(ServerMessage.toJSON(sm));
//     //             pendingResponses.delete(sm.requestId);
//     //             return;
//     //         }

//     //         if (sm.joinedRoom) {
//     //             joinedGameCallback();
//     //         }
//     //         if (sm.error) {
//     //             toaster.error({ title: 'Error', description: sm.error.message });
//     //             console.error('Error:', sm.error.message);
//     //         }
//     //         if (sm.state) {
//     //             console.log()
//     //             // State is { state: { ... } }
//     //             updateState(sm.state.state as any);
//     //         }
//     //         if (sm.roomDestroyed) {
//     //             roomEnded();
//     //         }
//     //     }

//     //     if (env.rawString) {
//     //         // preserve legacy raw string handling
//     //         const text = env.rawString.data;
//     //         try {
//     //             const parsed = JSON.parse(text);
//     //             // fallback to existing JSON-based handling
//     //             if (parsed.type === 'pong') {
//     //                 clearTimeout(pongTimeout);
//     //             }
//     //         } catch (e) {
//     //             // ignore
//     //         }
//     //     }

//     //     return;
//     // }

//     // fallback: string frames (legacy)
//     const e_data = JSON.parse(event.data);

//     if (e_data.type === "pong") {
//       clearTimeout(pongTimeout);
//     }

//     // Handle resolved request ID
//     if (e_data.requestId && pendingResponses.has(e_data.requestId)) {
//       const { resolve } = pendingResponses.get(e_data.requestId);
//       resolve(e_data); // Resolve the specific promise
//       pendingResponses.delete(e_data.requestId);
//       return;
//     }

//     switch (e_data["type"]) {
//       case "joinedRoom":
//         //  joinedGameCallback();
//         break;
//       case "error":
//         // Display error message
//         toaster.error({ title: "Error", description: e_data["message"] });
//         console.error("Error:", e_data["message"]);
//         break;
//       case "state":
//         updateState(e_data["state"]);
//         break;
//       case "roomDestroyed":
//         roomEnded();
//         break;
//     }
//   } catch (err) {
//     console.error("Failed to handle websocket message", err);
//   }
// }

// function handleWebSocketClose(event: CloseEvent) {
//   conn_store.set(false);
//   clearInterval(pingInterval);
//   websocketSetup();
// }

// function handleWebSocketError(event: Event) {
//   console.error("WebSocket error:", event);
//   if (ws?.CLOSED) {
//     websocketSetup();
//   }
// }

// /**
//  * Send a message to the server and wait for a response.
//  * @param message - The message to send to the server
//  * @returns A promise that resolves with the server's response
//  */
// export function sendMessageAndWaitForResponse(message: any) {
//   const requestId = uuidv4(); // Generate a unique ID for this request

//   return new Promise((resolve, reject) => {
//     // pendingResponses.set(requestId, { resolve, reject });
//     // // build a ClientMessage from the generic message
//     // const clientMsg: any = toClientMessageFromGeneric(message, requestId);
//     // const envelope: any = { clientMessage: clientMsg };
//     // if (ws?.readyState === WebSocket.OPEN) {
//     //     try {
//     //         const writer = Envelope.encode(envelope) as any;
//     //         const bytes: Uint8Array = writer.finish();
//     //         ws.send(bytes.buffer);
//     //     } catch (err) {
//     //         reject(err);
//     //     }
//     // } else {
//     //     reject(new Error('WebSocket is not open. Message not sent.'));
//     // }
//   });
// }

// /**
//  * Send Game Message to Host
//  * @param message - The message to send to the host
//  */
// export function sendMessage(message: any) {
//   // if (ws?.readyState === WebSocket.OPEN) {
//   //     const data = JSON.stringify(message);
//   //     const envelope = { clientName: getName(), message: data };
//   //     try {
//   //         const writer = Envelope.encode({ clientMessage: { sendMessage: envelope, requestId: '' } });
//   //         const bytes: Uint8Array = writer.finish();
//   //         ws.send(bytes.buffer);
//   //     } catch (err) {
//   //         console.error('Failed to send message', err);
//   //     }
//   // } else {
//   //     console.error("WebSocket is not open. Message not sent.");
//   // }
// }

// export function sendRawMessage(message: any) {
//   // send as protobuf Envelope.rawString for efficiency
//   if (ws?.readyState === WebSocket.OPEN) {
//     // try {
//     //     const raw = typeof message === 'string' ? message : JSON.stringify(message);
//     //     const envelope = { rawString: { data: raw } };
//     //     const writer = Envelope.encode(envelope) as any;
//     //     const bytes: Uint8Array = writer.finish();
//     //     ws.send(bytes.buffer);
//     // } catch (err) {
//     //     console.error('Failed to send raw message', err);
//     // }
//   } else {
//     console.error("WebSocket is not open. Message not sent.");
//   }
// }

// function sendPing() {
//   if (ws?.readyState === WebSocket.OPEN) {
//     // send a protobuf ping ClientMessage
//     // // ensure requestId is provided (protobuf ClientMessage requires it)
//     // const envelope = { clientMessage: toClientMessageFromGeneric({ type: 'ping' }) };
//     // try {
//     //     const writer = Envelope.encode(envelope) as any;
//     //     const bytes: Uint8Array = writer.finish();
//     //     ws.send(bytes.buffer);
//     // } catch (err) {
//     //     console.error('Failed to send ping', err);
//     // }
//     // pongTimeout = setTimeout(() => {
//     //     console.error("Pong not received in time, closing WebSocket.");
//     //     handleWebSocketClose(new CloseEvent("close", { code: 1006, reason: "Pong not received" }));
//     // }, pingTimeoutTime);
//   }
// }

// /* helper: convert existing { type, data } messages into ClientMessage shape */
// function toClientMessageFromGeneric(message: any, requestId?: string) {
//   const cm: any = { requestId: requestId ?? "" };
//   if (!message) return cm;

//   const type = message.type || message["t"] || "";
//   const data = message.data || message;

//   switch (type) {
//     case "joinRoom":
//       cm.joinRoom = {
//         roomId: data.roomId || data.roomID || data.room || "",
//         name: data.name || "",
//         userID: data.userID || data.userId || "",
//       };
//       break;
//     case "getTime":
//       cm.getTime = {};
//       break;
//     case "ping":
//       cm.ping = {};
//       break;
//     case "sendMessage":
//       cm.sendMessage = {
//         clientName: data.clientName || getName(),
//         message: typeof data === "string" ? data : JSON.stringify(data),
//       };
//       break;
//     case "gameState":
//       cm.gameState = { data: data || {} };
//       break;
//     case "createRoom":
//       cm.createRoom = {};
//       break;
//     case "destroyRoom":
//       cm.destroyRoom = {};
//       break;
//     default:
//       // If message already looks like a ClientMessage, merge
//       if (
//         message.joinRoom ||
//         message.getTime ||
//         message.ping ||
//         message.sendMessage ||
//         message.gameState
//       ) {
//         Object.assign(cm, message);
//       } else {
//         // fallback: send as low-latency/raw string inside lowLatency
//         cm.lowLatency = {
//           payload: new TextEncoder().encode(JSON.stringify(message)),
//         };
//       }
//   }

//   return cm;
// }
