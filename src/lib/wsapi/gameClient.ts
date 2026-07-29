// client/gameClient.ts
import { writable, get } from "svelte/store";
import { OpCode, encode, decode } from "./shared/protocol";
import type { PlayerInput, PlayerState } from "./shared/types";
import { toaster } from "$lib/util/toaster";
import { dbClient } from "../../stores/apiClient";
import { apiClient } from "$lib/backend/axios";
import { authClient } from "../../stores/authStore";


const RECONNECT_DELAY_MS = 1500;
const HEARTBEAT_INTERVAL_MS = 10000;
const HEARTBEAT_TIMEOUT_MS = 25000;
const MAX_PENDING_CRITICAL_MESSAGES = 50;

type RoomStatus = "LOBBY" | "RUNNING" | "UNKNOWN";

const defaultPlayerState: PlayerState = {
  name: "",
  score: 0,
  screen: "index",
  page_data: null,
  admin: false,
  drinks: 0,
  timer_stamp: new Date(),
  timer_duration: 0,
  index: -1,
  color: "",
  team: "",
  avatar: {
    eyes: 0,
    mouth: 0,
    hair: 0,
    emote: 0,
    selfieUrl: "",
  },
};

export const gameState = writable<PlayerState>(defaultPlayerState); // The screen content
export const connectionStatus = writable<"DISCONNECTED" | "CONNECTING" | "CONNECTED">("DISCONNECTED");
export const errorStore = writable<string | null>(null);
export const serverTimeOffset = writable<number>(0); // Add this to track time difference

const ignoreErrors: string[] = ["Game_Lobby", "Session expired", "Room not found"];

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
  private hasBoundLifecycleListeners = false;
  private pendingCriticalMessages: Array<{ op: OpCode; data: any }> = [];
  public localStream: MediaStream | null = null;
  public localAudioStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;
  public pc: RTCPeerConnection | null = null;
  public dc: RTCDataChannel | null = null;
  private listeners: Record<string, Function[]> = {};
  public activeDeviceId: string | null = null;
  public availableVideoDevices: MediaDeviceInfo[] = [];

  public on(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  public emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  constructor() {
    this.hydrateSessionFromStorage();
    this.bindBrowserLifecycleListeners();
    this.bindNativeRoomCodeListener();
  }

  connect(url: string) {
    this.connectUrl = url;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    connectionStatus.set("CONNECTING");
    this.ws = new WebSocket(url);
    this.ws.binaryType = "arraybuffer";

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
        (message) => message.op === OpCode.JOIN_ROOM || message.op === OpCode.RECONNECT,
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
          // If error is "Session expired", "Room invalid", or "Room not found", clear local session and reset Svelte gameState to index
          if (
            payload === "Session expired" ||
            payload === "Room invalid" ||
            payload === "Room not found"
          ) {
            this.clearSession();
            gameState.set(defaultPlayerState);
          }
          break;
        case OpCode.PONG:
          this.handlePong();
          break;

        case OpCode.TIME_RESPONSE:
          this.handleTimeResponse(payload); // payload is server timestamp
          break;

        case OpCode.WEBRTC_OFFER:
          if (payload.sdp) {
            console.log("[WebRTC Player] Received WEBRTC_OFFER from Host");
            this.handleWebRTCOffer(payload.sdp);
          }
          break;

        case OpCode.WEBRTC_ANSWER:
          if (payload.sdp) {
            console.log("[WebRTC Player] Received WEBRTC_ANSWER from Host");
            this.handleWebRTCAnswer(payload.sdp);
          }
          break;

        case OpCode.WEBRTC_ICE_CANDIDATE:
          if (payload.candidate) {
            console.log("[WebRTC Player] Received WEBRTC_ICE_CANDIDATE from Host");
            this.handleWebRTCIceCandidate(payload.candidate);
          }
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
    localStorage.setItem("couch_room", roomCode);

    const user = get(authClient.useSession()).data?.user;

    if (user) {
      try {
        let client = get(dbClient);
        if (!client) {
          client = await apiClient;
          if (client) {
            dbClient.set(client);
          }
        }
        const { data: me } = await client!.getUsersMe();
        let expressions = undefined;
        if (me.avatar_neutral_open) {
          expressions = {
            neutral_open: me.avatar_neutral_open,
            neutral_closed: me.avatar_neutral_closed || undefined,
            happy_open: me.avatar_happy_open || undefined,
            happy_closed: me.avatar_happy_closed || undefined,
            sad_open: me.avatar_sad_open || undefined,
            sad_closed: me.avatar_sad_closed || undefined,
            surprised_open: me.avatar_surprised_open || undefined,
            surprised_closed: me.avatar_surprised_closed || undefined,
          };
        }
        // Fallback to local storage if API returned blank/null selfie/expressions
        const localSelfie = localStorage.getItem("temp_selfie") || "";
        const localExprStr = localStorage.getItem("temp_expressions") || "";
        let fallbackExpressions = undefined;
        if (localExprStr) {
          try {
            fallbackExpressions = JSON.parse(localExprStr);
          } catch (e) {
            console.error("Failed to parse fallback expressions:", e);
          }
        }

        const avatar = {
          eyes: me.avatar_eyes || 3,
          mouth: me.avatar_mouth || 0,
          hair: me.avatar_hair || 0,
          emote: me.avatar_emote || 0,
          selfieUrl: me.avatar_selfie || localSelfie,
          expressions: expressions || fallbackExpressions,
          gender: me.avatar_gender || (typeof window !== "undefined" && localStorage.getItem("temp_gender")) || undefined,
        };
        this.sendPlayerInput("avatarUpdate", { avatar });
      } catch (error) {
        console.error("Failed to get user:", error);
        this.sendGuestAvatar();
      }
    } else {
      this.sendGuestAvatar();
    }
  }

  private sendGuestAvatar() {
    const sessionSelfie = (typeof window !== "undefined" && localStorage.getItem("temp_selfie")) || "";
    const sessionExprStr =
      (typeof window !== "undefined" && localStorage.getItem("temp_expressions")) || "";
    let expressions = undefined;
    if (sessionExprStr) {
      try {
        expressions = JSON.parse(sessionExprStr);
      } catch (e) {
        console.error("Failed to parse session expressions:", e);
      }
    }
    const sessionGender = (typeof window !== "undefined" && localStorage.getItem("temp_gender")) || undefined;
    const avatar = {
      eyes: 3,
      mouth: 0,
      hair: 0,
      emote: 0,
      selfieUrl: sessionSelfie,
      expressions,
      gender: sessionGender,
    };
    this.sendPlayerInput("avatarUpdate", { avatar });
  }

  private handleGameEnded() {
    this.clearSession();
    this.shouldReconnect = false;
    this.ws?.close();
    gameState.set({
      ...get(gameState),
      screen: "room_ended",
    });
  }

  async join(room: string, name: string, userId?: string) {
    this.sendCritical(OpCode.QUERY_ROOM_STATE, { roomCode: room }); // Ask server for current room state to decide if we can rejoin
    let roomState: "LOBBY" | "RUNNING";
    try {
      const res = await this.waitForResponse([OpCode.ROOM_STATE, OpCode.ERROR], 3000);
      if (res.op === OpCode.ERROR) throw new Error(res.payload);
      roomState = res.payload.status;
    } catch (e) {
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
    const roomCode = localStorage.getItem("couch_room");
    const name = this.name || localStorage.getItem("name");

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
        reject("Timeout");
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
    // Send over WebRTC DataChannel if open, otherwise fallback to WebSocket relay
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(encode(OpCode.INPUT, data));
    } else {
      this.send(OpCode.INPUT, data);
    }
  }

  /**
   * Send Player Input
   * @param type - type of input action, eg "startGame", "move", "textPrompt"...
   * @param data - input payload data
   */
  sendPlayerInput(type: string, data?: any) {
    const payload = {
      type: type,
      ...data,
    };
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(encode(OpCode.INPUT, payload));
    } else {
      this.send(OpCode.INPUT, payload);
    }
  }

  private getOrCreatePeerConnection(): RTCPeerConnection {
    if (this.pc) return this.pc;

    const iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ];
    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.ontrack = (event) => {
      console.log(`[WebRTC Player] Received remote track (${event.track.kind}) from Host`);
      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStream = stream;
      this.emit("remoteTrack", { stream, track: event.track });
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC Player] ICE Connection State: ${this.pc?.iceConnectionState}`);
      this.emit("iceState", this.pc?.iceConnectionState);
      if (this.pc?.iceConnectionState === "failed" || this.pc?.iceConnectionState === "disconnected") {
        console.warn("[WebRTC Player] ICE connection degraded. Requesting ICE restart...");
        this.requestIceRestart();
      }
    };

    this.pc.ondatachannel = (event) => {
      this.dc = event.channel;
      this.dc.binaryType = "arraybuffer";

      this.dc.onopen = () => {
        console.log("[WebRTC] Player DataChannel connected to Host");
      };

      this.dc.onmessage = (msgEvent: MessageEvent) => {
        try {
          const buffer = new Uint8Array(msgEvent.data);
          const { op, payload } = decode(buffer);
          if (op === OpCode.STATE_UPDATE) {
            this.trackStateStatus(payload);
            gameState.set(payload);
          }
        } catch (err) {
          console.error("[WebRTC] Error decoding DataChannel message:", err);
        }
      };

      this.dc.onclose = () => {
        console.log("[WebRTC] Player DataChannel closed");
      };
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send(OpCode.WEBRTC_ICE_CANDIDATE, {
          candidate: event.candidate.toJSON()
        });
      }
    };

    return this.pc;
  }

  private async handleWebRTCOffer(sdp: RTCSessionDescriptionInit) {
    try {
      if (typeof RTCPeerConnection === "undefined") return;

      const pc = this.getOrCreatePeerConnection();

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.send(OpCode.WEBRTC_ANSWER, { sdp: answer });
    } catch (err) {
      console.error("[WebRTC] Failed handling offer:", err);
    }
  }

  public async refreshVideoDevices(): Promise<MediaDeviceInfo[]> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.availableVideoDevices = devices.filter((d) => d.kind === "videoinput");
    return this.availableVideoDevices;
  }

  public currentFacingMode: "user" | "environment" = "user";
  public currentZoomLevel: number = 1.0;

  public findUltraWideCamera(): MediaDeviceInfo | undefined {
    // 1. Try label-based search
    const matchByLabel = this.availableVideoDevices.find((device) => {
      const label = device.label.toLowerCase();
      const isUltraWide =
        label.includes("ultra") ||
        label.includes("0.5") ||
        label.includes("super wide") ||
        label.includes("super-wide") ||
        label.includes("extra wide") ||
        label.includes("extrawide") ||
        label.includes("wide-angle") ||
        label.includes("wideangle");

      const isStandardWideOnly = label.includes("back wide camera") && !label.includes("ultra");

      return isUltraWide && !isStandardWideOnly;
    });

    if (matchByLabel) return matchByLabel;

    // 2. Fallback for Android device names without descriptive labels (e.g. "camera2 0", "camera2 2")
    const backCameras = this.availableVideoDevices.filter((d) => {
      const l = d.label.toLowerCase();
      return l.includes("back") || l.includes("rear") || !l.includes("front");
    });

    if (backCameras.length >= 2) {
      const secondaryBack = backCameras.find((d) => {
        const l = d.label.toLowerCase();
        return l.includes("1") || l.includes("2") || l.includes("aux") || l.includes("secondary");
      });
      if (secondaryBack) return secondaryBack;
    }

    return undefined;
  }

  public async startVideoStream(
    facingModeOrDeviceId: "user" | "environment" | { exact: string } = "user"
  ): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;

    let videoConstraints: MediaTrackConstraints = {
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1080, min: 720 },
      frameRate: { ideal: 30, min: 24 }
    };

    if (typeof facingModeOrDeviceId === "object" && facingModeOrDeviceId.exact) {
      videoConstraints.deviceId = facingModeOrDeviceId;
    } else {
      videoConstraints.facingMode = facingModeOrDeviceId as "user" | "environment";
      this.currentFacingMode = facingModeOrDeviceId as "user" | "environment";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      // Stop previous local video tracks to release camera hardware cleanly
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      this.localStream = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        this.activeDeviceId = track.getSettings().deviceId || null;
      }

      // Re-populate device list now that permissions are granted (labels are now visible)
      await this.refreshVideoDevices();

      const pc = this.getOrCreatePeerConnection();

      // Replace existing video sender track if PC is already active
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");

      if (videoSender && track) {
        await videoSender.replaceTrack(track);
      } else {
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.send(OpCode.WEBRTC_OFFER, { sdp: offer });
      }

      return true;
    } catch (err) {
      console.error("[WebRTC Player] Error starting stream:", err);
      return false;
    }
  }

  public async flipCamera(): Promise<boolean> {
    const nextFacingMode = this.currentFacingMode === "user" ? "environment" : "user";
    console.log(`[WebRTC Player] Flipping camera to ${nextFacingMode}...`);

    if (!this.localStream || !this.pc) {
      return await this.startVideoStream(nextFacingMode);
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: nextFacingMode
        },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return false;

      // Stop old video track
      this.localStream.getVideoTracks().forEach((t) => t.stop());
      this.localStream = newStream;
      this.currentFacingMode = nextFacingMode;

      const senders = this.pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");

      if (videoSender) {
        console.log("[WebRTC Player] Seamlessly replacing video track with flipped camera");
        await videoSender.replaceTrack(newVideoTrack);
        return true;
      } else {
        return await this.startVideoStream(nextFacingMode);
      }
    } catch (err) {
      console.error("[WebRTC Player] Error flipping camera:", err);
      return false;
    }
  }

  /**
   * Switches to the physical 0.5x ultra-wide camera or applies digital/track zoom as fallback.
   */
  public async setCameraZoom(zoomFactor: number): Promise<boolean> {
    this.currentZoomLevel = zoomFactor;

    // Refresh devices to make sure we have latest labels/devices
    await this.refreshVideoDevices();

    if (zoomFactor === 0.5) {
      // Step A: Check if device exposed an ultra-wide sensor as a discrete device
      const wideCamera = this.findUltraWideCamera();

      if (wideCamera && wideCamera.deviceId !== this.activeDeviceId) {
        console.log("[WebRTC Player] Switching to physical 0.5x ultra-wide lens:", wideCamera.label);
        return await this.startVideoStream({ exact: wideCamera.deviceId });
      }
    } else if (this.currentFacingMode === "environment" && (zoomFactor === 1.0 || zoomFactor === 2.0)) {
      // If we previously switched to an ultra-wide deviceId for 0.5x, check if we need to switch back to main back camera
      const wideCamera = this.findUltraWideCamera();
      if (wideCamera && this.activeDeviceId === wideCamera.deviceId) {
        const mainCamera = this.availableVideoDevices.find((d) => {
          const l = d.label.toLowerCase();
          return (
            (l.includes("back") || l.includes("rear") || l.includes("environment")) &&
            !l.includes("ultra") &&
            !l.includes("0.5") &&
            d.deviceId !== wideCamera.deviceId
          );
        });

        if (mainCamera) {
          console.log("[WebRTC Player] Switching back from 0.5x ultra-wide to main camera:", mainCamera.label);
          await this.startVideoStream({ exact: mainCamera.deviceId });
        } else {
          await this.startVideoStream("environment");
        }
      }
    }

    // Step B: Hardware zoom / track constraint zoom on active camera track
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    try {
      const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;

      if (capabilities?.zoom) {
        const minZoom = capabilities.zoom.min !== undefined ? capabilities.zoom.min : 1.0;
        const maxZoom = capabilities.zoom.max !== undefined ? capabilities.zoom.max : 3.0;
        const targetZoom = Math.min(Math.max(zoomFactor, minZoom), maxZoom);

        console.log(`[WebRTC Player] Applying track zoom constraint: target=${targetZoom} (range: ${minZoom}-${maxZoom})`);

        try {
          await videoTrack.applyConstraints({ zoom: targetZoom } as any);
          return true;
        } catch (e) {
          await videoTrack.applyConstraints({
            advanced: [{ zoom: targetZoom } as any]
          });
          return true;
        }
      }
    } catch (err) {
      console.warn("[WebRTC Player] Zoom constraint applying failed:", err);
    }

    return false;
  }

  public stopVideoStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  public isWebRTCSupported(): boolean {
    if (typeof window === "undefined") return false;
    return typeof RTCPeerConnection !== "undefined" && !!navigator?.mediaDevices?.getUserMedia;
  }

  public async startAudioStream(): Promise<boolean> {
    console.log("[WebRTC Player] startAudioStream requested");
    if (!this.isWebRTCSupported()) {
      console.warn("[WebRTC Player] MediaDevices or RTCPeerConnection not supported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      console.log("[WebRTC Player] Microphone stream acquired:", stream.id, stream.getAudioTracks());
      this.localAudioStream = stream;

      const pc = this.getOrCreatePeerConnection();

      stream.getAudioTracks().forEach(track => {
        console.log(`[WebRTC Player] Adding audio track (${track.kind}) to PC`);
        pc.addTrack(track, stream);
      });

      console.log("[WebRTC Player] Creating SDP offer for audio stream");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[WebRTC Player] Local description set. Sending WEBRTC_OFFER with audio track to Host");
      this.send(OpCode.WEBRTC_OFFER, { sdp: offer });
      return true;
    } catch (err) {
      console.error("[WebRTC Player] Failed to start microphone stream:", err);
      return false;
    }
  }

  public stopAudioStream() {
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach(track => {
        track.stop();
        if (this.pc) {
          const senders = this.pc.getSenders();
          const sender = senders.find(s => s.track === track);
          if (sender) {
            try {
              this.pc.removeTrack(sender);
            } catch (e) {
              console.warn("[WebRTC Player] Could not remove track from PC:", e);
            }
          }
        }
      });
      this.localAudioStream = null;
    }
  }

  private async handleWebRTCAnswer(sdp: RTCSessionDescriptionInit) {
    if (this.pc) {
      try {
        console.log("[WebRTC Player] Setting remote description from WEBRTC_ANSWER", sdp);
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        console.log("[WebRTC Player] Remote description set! signalingState:", this.pc.signalingState, "iceConnectionState:", this.pc.iceConnectionState);
      } catch (err) {
        console.error("[WebRTC Player] Error setting remote description from WEBRTC_ANSWER:", err);
      }
    } else {
      console.warn("[WebRTC Player] Received WEBRTC_ANSWER but this.pc is null");
    }
  }

  public async requestIceRestart() {
    if (!this.pc) return;
    try {
      console.log("[WebRTC Player] Creating SDP offer for ICE restart");
      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      this.send(OpCode.WEBRTC_OFFER, { sdp: offer });
    } catch (err) {
      console.error("[WebRTC Player] Error during ICE restart:", err);
    }
  }

  private async handleWebRTCIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc) {
      try {
        console.log("[WebRTC Player] Adding ICE candidate from Host");
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC Player] Error adding ICE candidate:", err);
      }
    }
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
    return !!(this.roomCode && this.name);
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
      localStorage.removeItem("couch_pid");
      localStorage.removeItem("couch_room");
    }
  }

  /**
   * Listen for room codes injected by the Android host via CustomEvent.
   * This lets the host change the room without reloading the page,
   * keeping the WebSocket session alive.
   */
  private bindNativeRoomCodeListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("nativeRoomCode", (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && detail.code) {
        console.log("[GameClient] Received native room code:", detail.code);
        this.joinRoomFromNative(detail.code);
      }
    });
  }

  /**
   * Join a room code provided by the native host.
   * If we're already connected, send JOIN_ROOM directly.
   * If not, queue it for when the connection opens.
   */
  private joinRoomFromNative(roomCode: string) {
    // Store it so hydrate/reconnect can find it
    localStorage.setItem("couch_room", roomCode);
    this.roomCode = roomCode;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Already connected — just join the room.
      // Clear any stale session data first so we don't try to reconnect
      // to a different room.
      this.clearSession();
      this.roomCode = roomCode;
      this.sendCritical(OpCode.JOIN_ROOM, { roomCode, name: this.name });
    } else {
      // Not connected yet — ensure we try to connect.
      // The existing onopen handler will flush the critical queue.
      if (this.connectUrl) {
        this.connect(this.connectUrl);
      }
    }
  }
}

export const gameClient = new GameClient();
