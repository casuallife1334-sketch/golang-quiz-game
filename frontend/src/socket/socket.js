import { getClientId, getClientToken, saveUserProfile } from "../userProfile";

const WS_URL = import.meta.env.PROD
  ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
  : "ws://localhost:3001/ws";

class QuizWebSocket {
  constructor(url) {
    this.url = url;
    this.id = "";
    this.connected = false;
    this.listeners = new Map();
    this.queue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.manualClose = false;
    this.hasEverConnected = false;

    this.connect();
  }

  connectionUrl() {
    const url = new URL(this.url);
    const clientId = getClientId();
    const clientToken = getClientToken();
    if (clientId) {
      url.searchParams.set("clientId", clientId);
    }
    if (clientToken) {
      url.searchParams.set("clientToken", clientToken);
    }
    return url.toString();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.manualClose = false;

    try {
      this.ws = new WebSocket(this.connectionUrl());
    } catch (error) {
      this.emitLocal("connect_error", error);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.flushQueue();
    });

    this.ws.addEventListener("message", (event) => {
      this.handleMessage(event.data);
    });

    this.ws.addEventListener("close", () => {
      const wasConnected = this.connected;
      this.connected = false;
      this.emitLocal("disconnect");

      if (!this.manualClose) {
        this.scheduleReconnect(wasConnected);
      }
    });

    this.ws.addEventListener("error", (error) => {
      this.emitLocal("connect_error", error);
    });
  }

  close() {
    this.manualClose = true;
    this.ws?.close();
  }

  on(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
    return this;
  }

  off(type, handler) {
    if (!this.listeners.has(type)) return this;

    if (handler) {
      this.listeners.get(type).delete(handler);
    } else {
      this.listeners.delete(type);
    }

    return this;
  }

  emit(type, payload = {}) {
    const message = JSON.stringify({ type, payload });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.queue.push(message);
      this.connect();
    }

    return this;
  }

  handleMessage(rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      console.error("[socket] Invalid message:", rawMessage, error);
      return;
    }

    if (!message?.type) return;

    if (message.type === "connect") {
      const wasReconnection = this.hasEverConnected;
      this.id = message.payload?.id || this.id;
      if (message.payload?.id && message.payload?.token) {
        saveUserProfile({
          clientId: message.payload.id,
          clientToken: message.payload.token,
        });
      }
      this.reconnectAttempts = 0;
      this.hasEverConnected = true;
      this.emitLocal("connect");
      if (wasReconnection) {
        this.emitLocal("reconnect");
      }
      return;
    }

    this.emitLocal(message.type, message.payload);
  }

  emitLocal(type, payload) {
    const handlers = this.listeners.get(type);
    if (!handlers) return;

    for (const handler of Array.from(handlers)) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[socket] Handler for ${type} failed:`, error);
      }
    }
  }

  flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    while (this.queue.length > 0) {
      this.ws.send(this.queue.shift());
    }
  }

  scheduleReconnect(wasConnected = false) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emitLocal("connect_error", new Error("WebSocket reconnect attempts exceeded"));
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    setTimeout(() => {
      this.connect();
      if (wasConnected) {
        this.emitLocal("reconnect_attempt", this.reconnectAttempts);
      }
    }, delay);
  }
}

export const socket = new QuizWebSocket(WS_URL);
