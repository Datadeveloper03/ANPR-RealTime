import type { AlertMessage } from "../types";

type AlertCallback = (alert: AlertMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<AlertCallback> = new Set();
  private reconnectInterval = 3000;
  private shouldReconnect = true;
  private isConnected = false;

  public connect(url = "ws://localhost:8000/alerts") {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log("🟢 Connected to ANPR Live Alert WebSocket");
      };

      this.socket.onmessage = (event) => {
        try {
          const alert: AlertMessage = JSON.parse(event.data);
          this.notifyListeners(alert);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.warn("🔴 WebSocket disconnected. Reconnecting in", this.reconnectInterval / 1000, "s...");
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(url), this.reconnectInterval);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (err) {
      console.error("Failed to establish WebSocket connection:", err);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(url), this.reconnectInterval);
      }
    }
  }

  public subscribe(callback: AlertCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(alert: AlertMessage) {
    this.listeners.forEach((callback) => {
      try {
        callback(alert);
      } catch (err) {
        console.error("Error in alert listener:", err);
      }
    });
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const wsService = new WebSocketService();
