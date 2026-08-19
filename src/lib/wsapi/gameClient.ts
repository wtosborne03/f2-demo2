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
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

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
        const storedPid = typeof window !== "undefined" ? localStorage.getItem("couch_pid") : null;
        const storedUserId = typeof window !== "undefined" ? localStorage.getItem("temp_user_id") : null;
        this.sendCritical(OpCode.RECONNECT, {
          roomCode: this.roomCode,
          name: this.name,
          playerId: storedPid || undefined,
          userId: storedUserId || undefined,
        });
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
          gameState.update((current) => ({ ...current, ...payload }));
          break;
        case OpCode.ERROR:
          errorStore.set(payload);
          if (!ignoreErrors.includes(payload)) {
            toaster.error({ title: "Error", description: payload });
          }
          // If error is "Room invalid" or "Room not found", clear local session and reset Svelte gameState to index
          if (
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

            this.handleWebRTCOffer(payload.sdp);
          }
          break;

        case OpCode.WEBRTC_ANSWER:
          if (payload.sdp) {

            this.handleWebRTCAnswer(payload.sdp);
          }
          break;

        case OpCode.WEBRTC_ICE_CANDIDATE:
          if (payload.candidate) {

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

  private async joinedRoom(playerId: string, roomCode: string, status?: string) {
    this.roomCode = roomCode;
    this.setRoomStatus(status);
    if (typeof window !== "undefined") {
      localStorage.setItem("code", this.roomCode!);
      localStorage.setItem("name", this.name);
      localStorage.setItem("couch_room", roomCode);
      if (playerId) {
        localStorage.setItem("couch_pid", playerId);
      }
    }

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
          selfieUrl: me.avatar_selfie || localSelfie,
          expressions: expressions || fallbackExpressions,
          gender: me.avatar_gender || (typeof window !== "undefined" && localStorage.getItem("temp_gender")) || undefined,
          catchphraseUrl: (me as any).avatar_catchphrase || (typeof window !== "undefined" && localStorage.getItem("temp_catchphrase")) || undefined,
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
    const sessionCatchphrase = (typeof window !== "undefined" && localStorage.getItem("temp_catchphrase")) || undefined;
    const avatar = {
      selfieUrl: sessionSelfie,
      expressions,
      gender: sessionGender,
      catchphraseUrl: sessionCatchphrase,
    };
    this.sendPlayerInput("avatarUpdate", { avatar });
  }

  private handleGameEnded() {
    this.clearSession();
    this.cleanupWebRTC();
    this.shouldReconnect = false;
    this.ws?.close();
    gameState.set({
      ...get(gameState),
      screen: "room_ended",
    });
  }

  async join(room: string, name: string, userId?: string) {
    const formattedRoom = room.trim().toUpperCase();
    this.name = name.trim();

    this.sendCritical(OpCode.QUERY_ROOM_STATE, { roomCode: formattedRoom });
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

    const currentSavedRoom = typeof window !== "undefined" ? localStorage.getItem("couch_room") : null;

    if (currentSavedRoom === formattedRoom || roomState === "RUNNING") {
      // try rejoin
      const rejoined = await this.tryRejoin(true, formattedRoom, this.name, userId);
      if (rejoined) return;
    }

    if (roomState === "RUNNING") {
      toaster.error({ title: "Error", description: "Game in progress and no active session found" });
      return;
    }

    // In LOBBY, send JOIN_ROOM (server will reclaim if reconnecting/stale)
    this.roomCode = formattedRoom;
    this.roomStatus = "LOBBY";
    this.sendCritical(OpCode.JOIN_ROOM, { roomCode: formattedRoom, name: this.name, userId });
  }

  public async tryRejoin(force = false, targetRoom?: string, targetName?: string, targetUserId?: string): Promise<boolean> {
    const roomCode = targetRoom || this.roomCode || (typeof window !== "undefined" ? localStorage.getItem("couch_room") : null);
    const name = targetName || this.name || (typeof window !== "undefined" ? localStorage.getItem("name") : null);
    const playerId = typeof window !== "undefined" ? localStorage.getItem("couch_pid") : null;
    const userId = targetUserId || (typeof window !== "undefined" ? localStorage.getItem("temp_user_id") : null);

    if (!roomCode || !name) return false;

    this.roomCode = roomCode;
    this.name = name;

    this.sendCritical(OpCode.RECONNECT, {
      roomCode,
      name,
      playerId: playerId || undefined,
      userId: userId || undefined
    });

    try {
      const res = await this.waitForResponse([OpCode.IDENTITY, OpCode.ERROR], 5000);
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

  public isDataChannelHealthy(): boolean {
    if (!this.dc || this.dc.readyState !== "open" || !this.pc) {
      return false;
    }
    const state = this.pc.iceConnectionState;
    return state === "connected" || state === "completed";
  }

  sendInput(data: PlayerInput) {
    if (this.isDataChannelHealthy()) {
      try {
        this.dc!.send(encode(OpCode.INPUT, data));
        return;
      } catch (err) {
        console.warn("[WebRTC Player] Error sending input via DataChannel, falling back to WS:", err);
      }
    }
    this.send(OpCode.INPUT, data);
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
    if (this.isDataChannelHealthy()) {
      try {
        this.dc!.send(encode(OpCode.INPUT, payload));
        return;
      } catch (err) {
        console.warn("[WebRTC Player] Error sending player input via DataChannel, falling back to WS:", err);
      }
    }
    this.send(OpCode.INPUT, payload);
  }

  public cleanupWebRTC() {
    if (this.dc) {
      try {
        this.dc.close();
      } catch (e) { }
      this.dc = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch (e) { }
      this.pc = null;
    }
    this.iceCandidateQueue = [];
  }

  private getOrCreatePeerConnection(): RTCPeerConnection {
    if (this.pc && this.pc.signalingState !== "closed") return this.pc;
    if (this.pc) {
      this.cleanupWebRTC();
    }

    const iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" }
    ];
    this.pc = new RTCPeerConnection({ iceServers });

    this.pc.ontrack = (event) => {

      const stream = event.streams[0] || new MediaStream([event.track]);
      this.remoteStream = stream;
      this.emit("remoteTrack", { stream, track: event.track });
    };

    this.pc.oniceconnectionstatechange = () => {

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

      };

      this.dc.onmessage = (msgEvent: MessageEvent) => {
        try {
          const buffer = new Uint8Array(msgEvent.data);
          const { op, payload } = decode(buffer);
          if (op === OpCode.STATE_UPDATE) {
            this.trackStateStatus(payload);
            gameState.update((current) => ({ ...current, ...payload }));
          }
        } catch (err) {
          console.error("[WebRTC] Error decoding DataChannel message:", err);
        }
      };

      this.dc.onclose = () => {

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

      if (this.pc && (this.pc.signalingState === "closed" || this.pc.iceConnectionState === "failed")) {

        this.cleanupWebRTC();
      }

      const pc = this.getOrCreatePeerConnection();

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await this.drainIceCandidateQueue();
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
    console.log(
      "[WebRTC Player] Enumerated Video Input Devices (" + this.availableVideoDevices.length + "):",
      this.availableVideoDevices.map((d, i) => ({
        index: i,
        label: d.label || "(Unlabeled device)",
        deviceId: d.deviceId,
        groupId: d.groupId
      }))
    );
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

    if (matchByLabel) {

      return matchByLabel;
    }

    // 2. Fallback for Android device names without descriptive labels (e.g. "camera2 0", "camera2 2")
    const backCameras = this.availableVideoDevices.filter((d) => {
      const l = d.label.toLowerCase();
      return l.includes("back") || l.includes("rear") || !l.includes("front");
    });

    console.log(
      "[WebRTC Player] Back cameras identified:",
      backCameras.map((d) => ({ label: d.label, deviceId: d.deviceId }))
    );

    if (backCameras.length >= 2) {
      // Exclude main back camera (index 0 / first back camera)
      const secondaryBack = backCameras.find((d, idx) => {
        if (idx === 0) return false; // First back camera is main 1.0x camera
        const cleanLabel = d.label.toLowerCase().replace(/^camera2\s*/i, "");
        return (
          cleanLabel.includes("1") ||
          cleanLabel.includes("2") ||
          cleanLabel.includes("aux") ||
          cleanLabel.includes("secondary") ||
          cleanLabel.includes("wide")
        );
      }) || backCameras[1]; // Fallback to 2nd back camera

      if (secondaryBack) {

        return secondaryBack;
      }
    }

    console.warn("[WebRTC Player] No discrete 0.5x ultra-wide camera device found.");
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

    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    };

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints
        });

      } catch (audioErr) {
        console.warn("[WebRTC Player] Could not acquire audio track with video, falling back to video-only:", audioErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false
        });
      }

      // Stop previous local tracks to release camera/mic hardware cleanly
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      this.localStream = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        this.activeDeviceId = track.getSettings().deviceId || null;

        if (track.getCapabilities) {

        }
      }

      // Re-populate device list now that permissions are granted (labels are now visible)
      await this.refreshVideoDevices();

      const pc = this.getOrCreatePeerConnection();
      const senders = pc.getSenders();
      let renegotiateNeeded = false;

      for (const t of stream.getTracks()) {
        const existingSender = senders.find((s) => s.track && s.track.kind === t.kind);
        if (existingSender) {

          await existingSender.replaceTrack(t);
        } else {

          pc.addTrack(t, stream);
          renegotiateNeeded = true;
        }
      }

      if (renegotiateNeeded || senders.length === 0) {

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

      if (wideCamera) {

        if (wideCamera.deviceId !== this.activeDeviceId) {

          return await this.startVideoStream({ exact: wideCamera.deviceId });
        }
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

    if (!this.isWebRTCSupported()) {
      console.warn("[WebRTC Player] MediaDevices or RTCPeerConnection not supported");
      return false;
    }
    try {
      if (this.localAudioStream) {
        this.stopAudioStream();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });

      this.localAudioStream = stream;

      const pc = this.getOrCreatePeerConnection();
      const senders = pc.getSenders();

      for (const track of stream.getAudioTracks()) {
        const existingAudioSender = senders.find((s) => s.track && s.track.kind === "audio");
        if (existingAudioSender) {

          await existingAudioSender.replaceTrack(track);
        } else {

          pc.addTrack(track, stream);
        }
      }


      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

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
        track.enabled = false;
        track.stop();
        if (this.pc) {
          const senders = this.pc.getSenders();
          const sender = senders.find(s => s.track === track || s.track?.kind === "audio");
          if (sender) {
            try {
              sender.replaceTrack(null);
            } catch (e) {
              console.warn("[WebRTC Player] Could not remove audio track from PC sender:", e);
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

        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await this.drainIceCandidateQueue();

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

      const offer = await this.pc.createOffer({ iceRestart: true });
      await this.pc.setLocalDescription(offer);
      this.send(OpCode.WEBRTC_OFFER, { sdp: offer });
    } catch (err) {
      console.error("[WebRTC Player] Error during ICE restart:", err);
    }
  }

  private async handleWebRTCIceCandidate(candidate: RTCIceCandidateInit) {
    if (this.pc && this.pc.remoteDescription && this.pc.remoteDescription.type) {
      try {

        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC Player] Error adding ICE candidate:", err);
      }
    } else {

      this.iceCandidateQueue.push(candidate);
    }
  }

  private async drainIceCandidateQueue() {
    if (!this.pc || !this.pc.remoteDescription || this.iceCandidateQueue.length === 0) return;

    const candidates = [...this.iceCandidateQueue];
    this.iceCandidateQueue = [];
    for (const candidate of candidates) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("[WebRTC Player] Error adding queued ICE candidate:", err);
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
    const roomCode = this.roomCode || (typeof window !== "undefined" ? localStorage.getItem("couch_room") : null);
    const name = this.name || (typeof window !== "undefined" ? localStorage.getItem("name") : null);
    if (roomCode && name) {
      this.roomCode = roomCode;
      this.name = name;
      return true;
    }
    return false;
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
    this.cleanupWebRTC();
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
